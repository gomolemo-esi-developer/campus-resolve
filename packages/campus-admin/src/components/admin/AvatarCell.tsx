import { useState } from "react";

interface AvatarCellProps {
    src?: string | null;
    initials?: string;
    alt: string;
    onClick?: () => void;
}

/**
 * Table avatar cell that falls back to an initials circle if the image
 * URL is missing, or if it fails to load (e.g. an expired presigned URL).
 */
export function AvatarCell({ src, initials, alt, onClick }: AvatarCellProps) {
    const [failed, setFailed] = useState(false);

    if (src && !failed) {
        return (
            <div
                className="w-9 h-9 shrink-0 rounded-full overflow-hidden border border-border cursor-pointer"
                style={{ width: 36, height: 36 }}
                onClick={onClick}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover object-center"
                    onError={() => setFailed(true)}
                />
            </div>
        );
    }

    return (
        <div
            className="w-9 h-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground cursor-pointer"
            style={{ width: 36, height: 36 }}
            onClick={onClick}
        >
            {initials}
        </div>
    );
}
