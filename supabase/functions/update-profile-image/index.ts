/*import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, imageData, oldAvatarUrl } = await req.json()

    // Verify the user is updating their own profile
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete old avatar if it exists and is not the default image
    if (oldAvatarUrl && !oldAvatarUrl.includes('pinimg.com')) {
      try {
        // Extract filename from URL
        const urlParts = oldAvatarUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        
        if (fileName && fileName.startsWith('avatar_')) {
          const { error: deleteError } = await supabaseClient.storage
            .from('avatars')
            .remove([fileName])
          
          if (deleteError) {
            console.error('Error deleting old avatar:', deleteError)
            // Don't fail the entire operation if deletion fails
          }
        }
      } catch (deleteErr) {
        console.error('Error processing old avatar deletion:', deleteErr)
        // Continue with upload even if deletion fails
      }
    }

    // Convert base64 to ArrayBuffer
    const base64ToArrayBuffer = (base64: string) => {
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes
    }

    // Upload new avatar
    const imageFileName = `avatar_${userId}_${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(imageFileName, base64ToArrayBuffer(imageData), {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the public URL for the uploaded image
    const { data: urlData } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(imageFileName)

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatarUrl: urlData.publicUrl,
        fileName: imageFileName 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in update-profile-image function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
  */
