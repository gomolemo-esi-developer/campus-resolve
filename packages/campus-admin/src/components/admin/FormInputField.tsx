import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormInputFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    optional?: boolean;
    hint?: string;
}

export function FormInputField({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    optional = false,
    hint,
}: FormInputFieldProps) {
    return (
        <div>
            <Label htmlFor={id} className="text-foreground text-base">
                {label}
                {optional && " (Optional)"}
            </Label>
            <Input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-12 border rounded-lg text-base transition-colors placeholder:text-gray-300 ${
                    error
                        ? "border-destructive focus-visible:border-destructive focus-visible:ring-0"
                        : "border-slate-100 focus-visible:border-primary focus-visible:ring-0"
                }`}
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            {hint && !error && <p className="text-muted-foreground text-sm mt-1">{hint}</p>}
        </div>
    );
}
