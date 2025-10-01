import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as FileSystem from 'expo-file-system';

interface UploadProgressCallback {
  (bytesUploaded: number, bytesTotal: number): void;
}

interface R2UploadOptions {
  fileUri: string;
  fileName: string;
  contentType: string;
  folder?: 'audio' | 'images' | 'avatars';
  onProgress?: UploadProgressCallback;
}

interface R2UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

class R2StorageService {
  private client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;
  private accountId: string;

  constructor() {
    this.bucketName = process.env.EXPO_PUBLIC_R2_BUCKET_NAME || '';
    this.publicUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_URL || '';
    this.accountId = process.env.EXPO_PUBLIC_R2_ACCOUNT_ID || '';

    if (!this.bucketName || !this.accountId) {
      console.error('❌ R2 configuration missing. Please add R2 credentials to .env file');
    }
  }

  /**
   * Initialize S3 client for Cloudflare R2
   */
  private initializeClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    const accessKeyId = process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not found in environment variables');
    }

    // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
    const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto', // R2 uses 'auto' as region
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.client;
  }

  /**
   * Convert React Native file URI to Uint8Array buffer
   */
  private async fileUriToBuffer(fileUri: string): Promise<Uint8Array> {
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes;
    } catch (error) {
      console.error('Error converting file to buffer:', error);
      throw new Error('Failed to read file for upload');
    }
  }

  /**
   * Upload file to Cloudflare R2
   */
  async uploadFile(options: R2UploadOptions): Promise<R2UploadResult> {
    const { fileUri, fileName, contentType, folder = 'audio', onProgress } = options;

    try {
      const client = this.initializeClient();
      
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists || !('size' in fileInfo)) {
        throw new Error('File does not exist or size unavailable');
      }

      const fileSize = fileInfo.size;
      const buffer = await this.fileUriToBuffer(fileUri);

      // Construct R2 key (path)
      const key = `${folder}/${fileName}`;

      // Use multipart upload for better progress tracking and reliability
      const upload = new Upload({
        client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        },
        queueSize: 4, // Concurrent part uploads
        partSize: 1024 * 1024 * 5, // 5MB per part
        leavePartsOnError: false,
      });

      // Track upload progress
      if (onProgress) {
        upload.on('httpUploadProgress', (progress: { loaded?: number; total?: number }) => {
          const bytesUploaded = progress.loaded || 0;
          const bytesTotal = progress.total || fileSize;
          onProgress(bytesUploaded, bytesTotal);
        });
      }

      await upload.done();

      // Construct public URL
      const publicUrl = `${this.publicUrl}/${key}`;

      console.log(`✅ File uploaded successfully to R2: ${publicUrl}`);

      return {
        success: true,
        publicUrl,
      };
    } catch (error) {
      console.error('❌ R2 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Delete file from Cloudflare R2
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const client = this.initializeClient();

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await client.send(command);
      console.log(`✅ File deleted successfully from R2: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ R2 delete error:', error);
      return false;
    }
  }

  /**
   * Extract R2 key from public URL
   */
  extractKeyFromUrl(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      // Remove leading slash
      return url.pathname.substring(1);
    } catch {
      return null;
    }
  }

  /**
   * Validate R2 configuration
   */
  isConfigured(): boolean {
    return !!(
      process.env.EXPO_PUBLIC_R2_ACCOUNT_ID &&
      process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID &&
      process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY &&
      process.env.EXPO_PUBLIC_R2_BUCKET_NAME
    );
  }
}

// Export singleton instance
export const r2Storage = new R2StorageService();
