import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminTable, AdminTableColumn } from "@/components/admin/AdminTable";
import { IdCell } from "@/components/admin/IdCell";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { ActionBar } from "@/components/admin/ActionBar";
import { Pagination } from "@/components/admin/Pagination";
import { FormModal, FormField } from "@/components/admin/FormModal";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useSearch } from "@/hooks/useSearch";
import { FormSelect, SelectOption } from "@/components/admin/FormSelect";
import { roleApi, ApiError, RoleData } from "@/services/adminApi";

// Level options will be loaded from database

const columns: AdminTableColumn<RoleData>[] = [
    {
        key: "id",
        label: "Role ID",
        width: "w-[190px]",
        render: (val) => <IdCell id={String(val)} />,
    },
    { key: "role", label: "Role Name", width: "w-[280px]" },
    {
        key: "level",
        label: "Level",
        render: (val) => (
            <Badge variant="secondary" className="font-semibold tracking-wide">
                {String(val)}
            </Badge>
        ),
    },
];

const validateForm = (data: Record<string, string>) => {
    const errors: Record<string, string> = {};
    if (!data.role?.trim()) {
        errors.role = "Role name is required";
    }
    if (!data.level) {
        errors.level = "Level is required";
    }
    return errors;
};

const SEARCHABLE_FIELDS: (keyof RoleData)[] = ["role", "level", "id"];

const initialData: RoleData[] = [];

interface FormDataType {
    role: string;
    level: string;
}

export default function Roles() {
    const { toast } = useToast();
    const [data, setData] = useState<RoleData[]>(initialData);
    const [levelOptions, setLevelOptions] = useState<SelectOption[]>([]);
    const [editingItem, setEditingItem] = useState<RoleData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { selectedRows, toggleRow, toggleSelectAll, clearSelection, setSelectedRows } =
        useRowSelection();
    const { searchQuery, setSearchQuery, filteredData } = useSearch(data, SEARCHABLE_FIELDS);
    const { currentPage, setCurrentPage, paginatedData } = usePagination(filteredData, 10);
    const {
        isAddDialogOpen,
        setIsAddDialogOpen,
        isEditDialogOpen,
        setIsEditDialogOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
    } = useAdminDialogs();
    const { formData, setFormData, formErrors, setFormErrors, resetForm } =
        useFormManagement<FormDataType>(
            { role: "", level: "" },
            validateForm
        );

    // Load data from backend on component mount
    useEffect(() => {
        loadLevels();
        loadRoles();
    }, []);

    const loadLevels = async () => {
        try {
            // Generate levels 1-9 dynamically for now
            // In the future, this can fetch from a database if needed
            const options = Array.from({ length: 9 }, (_, i) => ({
                label: String(i + 1),
                value: String(i + 1),
            }));
            setLevelOptions(options);
        } catch (error) {
            console.error('Error loading levels:', error);
        }
    };

    const loadRoles = async (search = "", page = 1) => {
        try {
            setIsLoading(true);
            const result = await roleApi.list(search, page, 10);
            setData(result.data);
            setCurrentPage(page);
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load roles",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const handleSave = async () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            setIsLoading(true);
            await roleApi.create({
                role: formData.role,
                level: formData.level,
            });
            setIsAddDialogOpen(false);
            resetForm();
            toast({
                title: "Role Added",
                description: `${formData.role} has been successfully added.`,
            });
            // Reload data from backend
            await loadRoles(searchQuery);
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to create role",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        const selectedIndex = Array.from(selectedRows)[0];
        const item = paginatedData[selectedIndex];
        if (item) {
            setEditingItem(item);
            setFormData({
                role: item.role,
                level: item.level,
            });
            setFormErrors({});
            setIsEditDialogOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!editingItem) return;

        try {
            setIsLoading(true);
            await roleApi.update(editingItem.id, {
                role: formData.role,
                level: formData.level,
            });
            setIsEditDialogOpen(false);
            setEditingItem(null);
            resetForm();
            setSelectedRows(new Set());
            toast({
                title: "Role Updated",
                description: `${formData.role} has been successfully updated.`,
            });
            // Reload data from backend
            await loadRoles(searchQuery);
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to update role",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        const selectedIndices = Array.from(selectedRows);
        // Get IDs of items to delete from paginatedData (accounts for search/filter)
        const itemsToDelete = selectedIndices.map((index) => paginatedData[index]);
        const idsToDelete = itemsToDelete.map((item) => item.id);

        try {
            setIsLoading(true);
            if (idsToDelete.length === 1) {
                await roleApi.delete(idsToDelete[0]);
            } else {
                await roleApi.batchDelete(idsToDelete);
            }
            setIsDeleteDialogOpen(false);
            setSelectedRows(new Set());
            toast({
                title: "Roles Deleted",
                description: `${selectedRows.size} role(s) have been successfully deleted.`,
                variant: "destructive",
            });
            // Reload data from backend
            await loadRoles(searchQuery);
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to delete role",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formFields: FormField[] = [
        {
            id: "role-name",
            name: "role",
            label: "Role Name",
            placeholder: "Enter role name",
            type: "text",
        },
    ];

    const isFormValid = formData.role.trim() && formData.level;

    return (
        <div className="w-full h-full flex flex-col items-center px-6 bg-background">
            <div className="w-full max-w-[1400px] h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                        <Input
                            type="search"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                loadRoles(e.target.value, 1);
                            }}
                            disabled={isLoading}
                            className="pl-16 pr-6 bg-card border-none h-12 text-lg rounded-full shadow-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-muted-foreground/30 disabled:opacity-50"
                        />
                    </div>

                    <Button
                        onClick={handleAdd}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-full pl-6 pr-2 h-12 shadow-lg shadow-primary/30 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span className="font-medium">Add</span>
                                <div className="bg-white rounded-full p-2">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                            </>
                        )}
                    </Button>
                </div>

                {/* Add Dialog */}
                <FormModal
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    title="ADD ROLE"
                    fields={formFields}
                    formData={formData}
                    formErrors={formErrors}
                    onFormDataChange={(field, value) =>
                        setFormData({ ...formData, [field]: value })
                    }
                    onSubmit={handleSave}
                    onCancel={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                    }}
                    submitLabel="Save"
                    isValid={isFormValid}
                >
                    <FormSelect
                        label="Level"
                        value={formData.level}
                        onChange={(value) => setFormData({ ...formData, level: value })}
                        options={levelOptions}
                        placeholder="Select level"
                        error={formErrors.level}
                        required
                    />
                </FormModal>

                {/* Edit Dialog */}
                <FormModal
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    title="EDIT ROLE"
                    fields={formFields}
                    formData={formData}
                    formErrors={formErrors}
                    onFormDataChange={(field, value) =>
                        setFormData({ ...formData, [field]: value })
                    }
                    onSubmit={handleSaveEdit}
                    onCancel={() => {
                        setIsEditDialogOpen(false);
                        resetForm();
                    }}
                    submitLabel="Save"
                    isValid={isFormValid}
                >
                    <FormSelect
                        label="Level"
                        value={formData.level}
                        onChange={(value) => setFormData({ ...formData, level: value })}
                        options={levelOptions}
                        placeholder="Select level"
                        error={formErrors.level}
                        required
                    />
                </FormModal>

                <DeleteConfirmDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    itemCount={selectedRows.size}
                    itemType="Role"
                    onConfirm={confirmDelete}
                />

                {/* Table Container */}
                <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col flex-1 overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/30 flex items-center justify-center z-10 rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    <AdminTable
                        columns={columns}
                        data={paginatedData}
                        selectedRows={selectedRows}
                        onRowToggle={toggleRow}
                        onSelectAll={() => toggleSelectAll(data.length)}
                    />

                    {/* Action Bar */}
                    {selectedRows.size > 0 && (
                        <ActionBar
                            selectedCount={selectedRows.size}
                            onClear={clearSelection}
                            onEdit={selectedRows.size === 1 ? handleEdit : undefined}
                            onDelete={() => setIsDeleteDialogOpen(true)}
                            canEdit={selectedRows.size === 1}
                        />
                    )}
                </div>

                {/* Pagination */}
                <div className="bg-background flex-shrink-0">
                    <Pagination
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        totalItems={filteredData.length}
                        itemsPerPage={10}
                    />
                </div>
            </div>
        </div>
    );
}
