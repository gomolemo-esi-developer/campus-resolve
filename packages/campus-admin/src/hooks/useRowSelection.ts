import { useState, useCallback } from "react";

export function useRowSelection() {
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    const toggleRow = useCallback((index: number) => {
        setSelectedRows((prev) => {
            const newSelection = new Set(prev);
            if (newSelection.has(index)) {
                newSelection.delete(index);
            } else {
                newSelection.add(index);
            }
            return newSelection;
        });
    }, []);

    const toggleSelectAll = useCallback((totalItems: number) => {
        setSelectedRows((prev) => {
            if (prev.size === totalItems) {
                return new Set();
            } else {
                return new Set(Array.from({ length: totalItems }, (_, i) => i));
            }
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedRows(new Set());
    }, []);

    return {
        selectedRows,
        setSelectedRows,
        toggleRow,
        toggleSelectAll,
        clearSelection,
    };
}
