const STORAGE_API = 'http://localhost:3000/api/storage';

function getAuthToken(): string {
  return localStorage.getItem('auth_token') || '';
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'word';
  return 'document';
}

export interface UploadResult {
  key: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  attachment?: Record<string, unknown>;
  s3Url?: string; // Complete S3 URL for direct access
  title?: string; // Optional custom title for the file
}

export async function uploadFileToS3(
  file: File,
  context: 'complaint' | 'note',
  contextId: string,
  options?: {
    messageId?: string;
    onProgress?: (progress: number) => void;
    title?: string; // Optional custom title
  }
): Promise<UploadResult> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 1. Get presigned upload URL
  const urlRes = await fetch(`${STORAGE_API}/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      context,
      contextId,
    }),
  });

  if (!urlRes.ok) throw new Error('Failed to get upload URL');
  const urlData = await urlRes.json();
  if (!urlData.success) throw new Error(urlData.message || 'Failed to get upload URL');

  const { uploadUrl, key } = urlData.data;

  // 2. Upload file directly to S3 via presigned URL
  // Use XMLHttpRequest for progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (options?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          options.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('S3 upload failed'));
    xhr.send(file);
  });

  // 3. Confirm upload in backend
  const fileType = getFileCategory(file.type);
  const confirmRes = await fetch(`${STORAGE_API}/confirm-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      key,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      mimeType: file.type,
      context,
      contextId,
      ...(options?.messageId ? { messageId: options.messageId } : {}),
      ...(options?.title ? { title: options.title } : {}),
    }),
  });

  if (!confirmRes.ok) throw new Error('Failed to confirm upload');
  const confirmData = await confirmRes.json();

  // Extract the full S3 URL from the confirm response if available
  const s3Url = confirmData.data?.url || confirmData.data?.s3Url || confirmData.data?.fullUrl || confirmData.data?.storageUrl || null;

  return {
    key,
    fileName: file.name,
    fileSize: file.size,
    fileType,
    mimeType: file.type,
    attachment: confirmData.data,
    s3Url: s3Url || undefined,
    title: options?.title,
  };
}

function isBlobUrl(value: string): boolean {
  return value.startsWith('blob:') || value.startsWith('data:');
}

export async function getDownloadUrl(attachmentId: string): Promise<string> {
  if (isBlobUrl(attachmentId)) {
    throw new Error('Invalid attachment identifier: local blob URL cannot be used to download');
  }

  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${STORAGE_API}/download-url/${attachmentId}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Download URL request failed:', res.status, errorBody);
    throw new Error('Failed to get download URL');
  }
  const data = await res.json();
  return data.data.downloadUrl;
}
