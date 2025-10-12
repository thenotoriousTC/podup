import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper function to convert bytes to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// File validation constants
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_UPLOADS_PER_DAY = 20; // Rate limit

/**
 * Sanitizes filename to prevent path traversal and other security issues
 */
function sanitizeFilename(filename: string): string {
  // Remove any directory paths
  const baseName = filename.split('/').pop()?.split('\\').pop() || 'file';
  
  // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Prevent hidden files
  return sanitized.startsWith('.') ? sanitized.substring(1) : sanitized;
}

/**
 * Checks rate limit for user uploads
 */
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean; count: number }> {
  const today = new Date().toISOString().split('T')[0];
  
  const { count, error } = await supabase
    .from('podcasts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, count: 0 }; // Allow on error, but log it
  }
  
  return {
    allowed: (count || 0) < MAX_UPLOADS_PER_DAY,
    count: count || 0,
  };
}

/**
 * AWS Signature v4 helper functions
 */
async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function sha256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(hash));
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

/**
 * Uploads file to Cloudflare R2 using direct PUT request with AWS v4 signing
 */
async function uploadToR2(
  fileData: Uint8Array,
  fileName: string,
  contentType: string,
  folder: 'audio' | 'images'
): Promise<string> {
  // Get credentials from environment
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'podup-media';

  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error('R2 credentials not configured');
  }

  console.log('🔧 R2 Config:', { accountId, bucketName, hasAccessKey: !!accessKeyId });

  const key = `${folder}/${fileName}`;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucketName}/${key}`;
  const region = 'auto';
  const service = 's3';

  // Get current time
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  // Create canonical request
  const payloadHash = await sha256(fileData);
  const canonicalUri = `/${bucketName}/${key}`;
  const canonicalQuerystring = '';
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(new TextEncoder().encode(canonicalRequest));
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  // Calculate signature
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));

  // Create authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  console.log('📍 Upload endpoint:', endpoint);

  // Upload the file
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Host': host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorizationHeader,
      'Content-Type': contentType,
      'Content-Length': String(fileData.length),
    },
    body: fileData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ R2 upload failed:', response.status, errorText);
    throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
  }

  console.log('✅ R2 upload response:', response.status);

  // Return public URL
  const publicUrl = Deno.env.get('R2_PUBLIC_URL') || `https://${bucketName}.r2.dev`;
  return `${publicUrl}/${key}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(supabaseAdmin, user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Daily upload limit reached (${MAX_UPLOADS_PER_DAY} podcasts per day)`,
          count: rateLimit.count,
          limit: MAX_UPLOADS_PER_DAY,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const contentType = req.headers.get('content-type') || '';
    console.log('📥 Content-Type:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formData;
    try {
      formData = await req.formData();
      console.log('✅ FormData parsed successfully');
    } catch (error) {
      console.error('❌ FormData parsing error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to parse form data', details: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const file = formData.get('file');
    const fileType = formData.get('fileType') as string; // 'audio' or 'image'
    const originalFilename = formData.get('filename') as string;

    console.log('📦 Received:', { 
      fileType, 
      originalFilename, 
      fileExists: !!file,
      fileConstructor: file?.constructor?.name 
    });

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle file as Blob (works with File or Blob from React Native)
    let fileBlob: Blob;
    let mimeType: string;
    let fileSize: number;

    if (file instanceof Blob) {
      fileBlob = file;
      mimeType = file.type;
      fileSize = file.size;
    } else {
      // Fallback for unexpected formats
      console.error('❌ Unexpected file format:', typeof file);
      return new Response(
        JSON.stringify({ error: 'Invalid file format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 File details:', { mimeType, fileSize, fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2) });

    // Validate file type
    const isAudio = fileType === 'audio';
    const allowedTypes = isAudio ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;

    if (!allowedTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          receivedType: mimeType,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
          receivedSize: `${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize filename and create unique name
    const extension = originalFilename?.split('.').pop() || (isAudio ? 'm4a' : 'jpg');
    const sanitizedBase = sanitizeFilename(originalFilename || 'file');
    const timestamp = Date.now();
    const fileName = `${user.id}_${timestamp}_${sanitizedBase}`;
    const finalFileName = fileName.endsWith(`.${extension}`) ? fileName : `${fileName}.${extension}`;

    // Convert file to Uint8Array
    let fileData: Uint8Array;
    try {
      const arrayBuffer = await fileBlob.arrayBuffer();
      fileData = new Uint8Array(arrayBuffer);
      console.log('✅ File converted to Uint8Array, size:', fileData.length);
    } catch (error) {
      console.error('❌ File conversion error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process file data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Uploading ${fileType}: ${finalFileName} (${(fileSize / (1024 * 1024)).toFixed(2)}MB)`);

    // Upload to R2
    const folder = isAudio ? 'audio' : 'images';
    const publicUrl = await uploadToR2(fileData, finalFileName, mimeType, folder);

    console.log(`✅ Upload successful: ${publicUrl}`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        fileName: finalFileName,
        size: file.size,
        type: mimeType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Always return valid JSON
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Upload failed. Please try again.',
        details: error?.message || String(error),
        errorType: error?.name || 'Unknown',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
