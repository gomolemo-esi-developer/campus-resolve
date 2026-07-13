import { useState, useCallback } from "react";

export function useAdminDialogs() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const openAddDialog = useCallback(() => {
        setIsAddDialogOpen(true);
    }, []);

    const closeAddDialog = useCallback(() => {
        setIsAddDialogOpen(false);
    }, []);

    const openEditDialog = useCallback(() => {
        setIsEditDialogOpen(true);
    }, []);

    const closeEditDialog = useCallback(() => {
        setIsEditDialogOpen(false);
    }, []);

    const openDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(true);
    }, []);

    const closeDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
    }, []);

    return {
        isAddDialogOpen,
        setIsAddDialogOpen,
        openAddDialog,
        closeAddDialog,
        isEditDialogOpen,
        setIsEditDialogOpen,
        openEditDialog,
        closeEditDialog,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        openDeleteDialog,
        closeDeleteDialog,
    };
}
