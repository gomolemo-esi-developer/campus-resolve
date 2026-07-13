const STORAGE_API = '/api/storage';

function getAuthToken(): string {
    return localStorage.getItem('auth_token') || 'test-token-dev';
}

export interface ImageUploadResult {
    key: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    mimeType: string;
    s3Url?: string;
}

export async function uploadImageToS3(
    file: File,
    contextId: string,
    context: 'student' | 'staff' = 'staff',
    options?: {
        onProgress?: (progress: number) => void;
    }
): Promise<ImageUploadResult> {
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
        context: context, // use provided context ('staff' or 'student')
        contextId,
      }),
    });

    if (!urlRes.ok) {
        const errorData = await urlRes.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || 'Failed to get upload URL';
        const errorDetails = errorData.details ? ` (${errorData.details.join('; ')}))` : '';
        throw new Error(`${errorMsg}${errorDetails}`);
    }
    const urlData = await urlRes.json();
    if (!urlData.success) {
        throw new Error(urlData.message || 'Failed to get upload URL');
    }

    const { uploadUrl, key } = urlData.data;

    // 2. Upload file directly to S3 via presigned URL
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
    const confirmRes = await fetch(`${STORAGE_API}/confirm-upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key,
        fileName: file.name,
        fileSize: file.size,
        fileType: 'image',
        mimeType: file.type,
        context: context, // match context used for upload-url
        contextId,
      }),
    });

    if (!confirmRes.ok) {
        const errorData = await confirmRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to confirm upload');
    }
    const confirmData = await confirmRes.json();

    // Extract the full S3 URL from the confirm response
    const s3Url = confirmData.data?.url || confirmData.data?.s3Url || confirmData.data?.fullUrl || confirmData.data?.storageUrl || null;

    return {
        key,
        fileName: file.name,
        fileSize: file.size,
        fileType: 'image',
        mimeType: file.type,
        s3Url: s3Url || undefined,
    };
}