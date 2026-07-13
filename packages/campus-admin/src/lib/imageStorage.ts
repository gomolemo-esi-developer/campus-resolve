/**
 * Image Storage Utility
 * Handles saving and retrieving images from localStorage
 */

const IMAGE_STORAGE_KEY = 'admin_staff_images';

interface StoredImage {
    staffId: string;
    data: string; // base64
    timestamp: number;
}

/**
 * Saves an image to localStorage
 * @param staffId - Unique staff identifier
 * @param imageData - Base64 encoded image data
 */
export function saveImage(staffId: string, imageData: string): void {
    try {
        const images = getStoredImages();
        const index = images.findIndex((img) => img.staffId === staffId);

        if (index >= 0) {
            images[index] = { staffId, data: imageData, timestamp: Date.now() };
        } else {
            images.push({ staffId, data: imageData, timestamp: Date.now() });
        }

        localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    } catch (error) {
        console.error('Failed to save image:', error);
    }
}

/**
 * Retrieves an image from localStorage
 * @param staffId - Unique staff identifier
 * @returns Base64 encoded image data or null
 */
export function getImage(staffId: string): string | null {
    try {
        const images = getStoredImages();
        const image = images.find((img) => img.staffId === staffId);
        return image?.data || null;
    } catch (error) {
        console.error('Failed to retrieve image:', error);
        return null;
    }
}

/**
 * Removes an image from localStorage
 * @param staffId - Unique staff identifier
 */
export function removeImage(staffId: string): void {
    try {
        const images = getStoredImages();
        const filtered = images.filter((img) => img.staffId !== staffId);
        localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to remove image:', error);
    }
}

/**
 * Gets all stored images
 * @returns Array of stored images
 */
function getStoredImages(): StoredImage[] {
    try {
        const data = localStorage.getItem(IMAGE_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to parse stored images:', error);
        return [];
    }
}

/**
 * Clears all stored images
 */
export function clearAllImages(): void {
    try {
        localStorage.removeItem(IMAGE_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear images:', error);
    }
}

/**
 * Gets storage size info
 * @returns Object with approximate usage info
 */
export function getStorageInfo(): { usedBytes: number; estimatedItems: number } {
    try {
        const data = localStorage.getItem(IMAGE_STORAGE_KEY);
        const usedBytes = data ? new Blob([data]).size : 0;
        const images = data ? JSON.parse(data) : [];
        return {
            usedBytes,
            estimatedItems: images.length,
        };
    } catch (error) {
        console.error('Failed to get storage info:', error);
        return { usedBytes: 0, estimatedItems: 0 };
    }
}
