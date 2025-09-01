export interface AudioFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface UploadProgress {
  phase: 'image' | 'audio' | 'database' | 'complete';
  percentage: number;
  message: string;
}
