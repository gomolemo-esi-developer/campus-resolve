import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInputField } from "./FormInputField";

export interface FormField {
    id: string;
    name: string;
    label: string;
    placeholder?: string;
    optional?: boolean;
    type?: "text" | "email" | "number" | "password";
    hint?: string;
}

interface FormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    fields: FormField[];
    formData: Record<string, string>;
    formErrors: Record<string, string>;
    onFormDataChange: (field: string, value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel?: string;
    isLoading?: boolean;
    isValid?: boolean;
    children?: React.ReactNode;
}

export function FormModal({
    open,
    onOpenChange,
    title,
    description,
    fields,
    formData,
    formErrors,
    onFormDataChange,
    onSubmit,
    onCancel,
    submitLabel = "Save",
    isLoading = false,
    isValid = true,
    children,
}: FormModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl border-none shadow-lg max-h-[85vh] overflow-y-auto modal-content-scroll"
                style={{ backgroundColor: 'hsl(var(--card))' }}
                aria-describedby={description ? `${title.toLowerCase()}-description` : undefined}
            >
                <DialogHeader className="space-y-4 px-6 pt-6">
                    <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">
                        {title}
                    </DialogTitle>
                    {description && (
                        <p id={`${title.toLowerCase()}-description`} className="sr-only">
                            {description}
                        </p>
                    )}
                </DialogHeader>

                <div className="px-6 pb-6">
                    <div className="py-6 space-y-6">
                        {fields.map((field) => (
                            <FormInputField
                                key={field.id}
                                id={field.id}
                                label={field.label}
                                value={formData[field.name] || ""}
                                onChange={(value) => onFormDataChange(field.name, value)}
                                placeholder={field.placeholder}
                                error={formErrors[field.name]}
                                optional={field.optional}
                                hint={field.hint}
                            />
                        ))}
                        {children}
                    </div>

                    <div className="flex justify-center gap-4 pt-6">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="w-32 h-12 text-base font-semibold rounded-lg"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onSubmit}
                            className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                            disabled={!isValid || isLoading}
                        >
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
