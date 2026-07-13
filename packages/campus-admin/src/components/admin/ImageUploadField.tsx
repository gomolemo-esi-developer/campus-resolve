import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { uploadImageToS3 } from "@/lib/s3ImageUpload";

interface ImageUploadFieldProps {
    value: string; // Current image URL or empty string
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    maxSizeMB?: number;
    disabled?: boolean;
    contextId?: string; // Student ID or Staff ID for S3 upload context
    contextType?: 'student' | 'staff';
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ImageUploadField({
    value,
    onChange,
    label = "Profile Picture",
    placeholder = "Drag & drop or click to upload image",
    maxSizeMB = 5,
    disabled = false,
    contextId,
    contextType = 'staff',
}: ImageUploadFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const validateFile = (file: File): string | null => {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `Please select a valid image file (${ALLOWED_TYPES.map(t => t.replace('image/', '').toUpperCase()).join(', ')})`;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            return `File size must be less than ${maxSizeMB}MB`;
        }

        return null;
    };

    const processUpload = async (file: File) => {
        setError("");
        setIsUploading(true);
        setUploadProgress(0);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setIsUploading(false);
            return;
        }

        try {
            const result = await uploadImageToS3(
                file,
                contextId || 'unknown',
                contextType,
                {
                    onProgress: setUploadProgress,
                }
            );

             if (result.s3Url) {
                 onChange(result.s3Url);
             } else {
                 // Fallback to full URL construction if s3Url not provided
                 const fullUrl = `https://${import.meta.env.VITE_AWS_BUCKET_NAME}.s3.amazonaws.com/${result.key}`;
                 onChange(fullUrl);
             }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to upload image";
            setError(message);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled || isUploading) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processUpload(files[0]);
        }
    };

    const handleRemove = () => {
        onChange("");
        setError("");
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClick = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="w-full space-y-2">
            {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

            {/* Current Image Preview */}
            {value && !isUploading && (
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <img
                        src={value}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                        onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e5e7eb'/%3E%3Ctext x='40' y='45' font-family='Arial' font-size='10' fill='%236b7280' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                    />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Current Profile Picture</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={value}>
                            {value}
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={handleRemove}
                        disabled={disabled || isUploading}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove image"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Upload Area or Upload Progress */}
            {(!value || isUploading) && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-border hover:border-primary/50 hover:bg-muted/30",
                        (disabled || isUploading) && "opacity-50 cursor-not-allowed",
                        isUploading && "cursor-wait"
                    )}
                >
                    {isUploading ? (
                        <div className="space-y-3">
                            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">Uploading...</p>
                                <Progress value={uploadProgress} className="w-full h-2" />
                                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Upload className={cn(
                                "w-10 h-10 mx-auto transition-colors duration-200",
                                isDragging ? "text-primary" : "text-muted-foreground"
                            )} />
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    {isDragging ? "Drop image here" : placeholder}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, GIF, WEBP • Max {maxSizeMB}MB
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="hidden"
            />

            {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}