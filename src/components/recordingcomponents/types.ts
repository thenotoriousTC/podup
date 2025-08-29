export interface Recording {
  id: string;
  uri: string;
  title: string;
  duration: number;
  createdAt: Date;
}

export interface UploadProgress {
  phase: 'image' | 'audio' | 'database' | 'complete';
  percentage: number;
  message: string;
}

export interface AudioFile {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
}
