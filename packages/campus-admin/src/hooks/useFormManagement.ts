import { useState, useCallback } from "react";

export function useFormManagement<T extends Record<string, any>>(
    initialData: T,
    validate?: (data: T) => Record<string, string>
) {
    const [formData, setFormData] = useState<T>(initialData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const setField = useCallback((field: keyof T, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(initialData);
        setFormErrors({});
    }, [initialData]);

    const validateForm = useCallback(() => {
        if (!validate) return true;
        const errors = validate(formData);
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, validate]);

    const clearErrors = useCallback(() => {
        setFormErrors({});
    }, []);

    return {
        formData,
        setFormData,
        setField,
        formErrors,
        setFormErrors,
        validateForm,
        resetForm,
        clearErrors,
    };
}
