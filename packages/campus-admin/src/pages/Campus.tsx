import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    IdCell,
    Pagination,
    ActionBar,
    DeleteConfirmDialog,
    FormModal,
    FormField,
    VALIDATION,
    ERROR_MESSAGES,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useSearch } from "@/hooks/useSearch";
import { campusApi, ApiError } from "@/services/adminApi";

interface CampusData {
    id: string;
    name: string;
    abbreviation: string;
    location: string;
}

// Initial state - will be populated from backend
const initialData: CampusData[] = [];

interface FormDataType {
    name: string;
    abbreviation: string;
    location: string;
}

const SEARCHABLE_FIELDS: (keyof CampusData)[] = ["name", "abbreviation", "location", "id"];

export default function Campus() {
    const { toast } = useToast();
    const [data, setData] = useState<CampusData[]>(initialData);
    const [editingItem, setEditingItem] = useState<CampusData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Hooks
    const { selectedRows, toggleRow, toggleSelectAll, clearSelection, setSelectedRows } = useRowSelection();
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
    const { formData, setFormData, formErrors, setFormErrors, resetForm } = useFormManagement<FormDataType>(
        { name: "", abbreviation: "", location: "" },
        validateForm
    );

    // Load data from backend on component mount
    useEffect(() => {
        loadCampuses();
    }, []);

    const loadCampuses = async (search = "", page = 1) => {
        try {
            setIsLoading(true);
            const result = await campusApi.list(search, page, 10);
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
                    description: "Failed to load campuses",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Validation
    function validateForm(data: FormDataType) {
        const errors: Record<string, string> = {};

        if (!data.name.trim()) {
            errors.name = ERROR_MESSAGES.FIELD_REQUIRED;
        }
        if (!data.abbreviation.trim()) {
            errors.abbreviation = ERROR_MESSAGES.FIELD_REQUIRED;
        } else if (
            data.abbreviation.length < VALIDATION.ABBREVIATION_MIN ||
            data.abbreviation.length > VALIDATION.ABBREVIATION_MAX
        ) {
            errors.abbreviation = ERROR_MESSAGES.ABBREVIATION_LENGTH;
        }

        return errors;
    }

    const handleAddOpen = () => {
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
            await campusApi.create(formData);
            setIsAddDialogOpen(false);
            resetForm();
            toast({
                title: "Campus Added",
                description: "The campus has been successfully added.",
            });
            // Reload data from backend
            await loadCampuses(searchQuery);
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
                    description: "Failed to create campus",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        const selectedIndex = Array.from(selectedRows)[0];
        // Get item from paginatedData to handle search/filter correctly
        const itemToEdit = paginatedData[selectedIndex];
        if (itemToEdit) {
            setEditingItem(itemToEdit);
            setFormData({
                name: itemToEdit.name,
                abbreviation: itemToEdit.abbreviation,
                location: itemToEdit.location,
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
            await campusApi.update(editingItem.id, formData);
            setIsEditDialogOpen(false);
            setEditingItem(null);
            resetForm();
            setSelectedRows(new Set());
            toast({
                title: "Campus Updated",
                description: "The campus has been successfully updated.",
            });
            // Reload data from backend
            await loadCampuses(searchQuery);
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
                    description: "Failed to update campus",
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
                await campusApi.delete(idsToDelete[0]);
            } else {
                await campusApi.batchDelete(idsToDelete);
            }
            setIsDeleteDialogOpen(false);
            setSelectedRows(new Set());
            toast({
                title: "Campus Deleted",
                description: `${selectedIndices.length} campus(es) have been successfully deleted.`,
                variant: "destructive",
            });
            // Reload data from backend
            await loadCampuses(searchQuery);
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
                    description: "Failed to delete campus",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const addFormFields: FormField[] = [
        {
            id: "campus-name",
            name: "name",
            label: "Campus Name",
            placeholder: "Soshanguve Campus",
        },
        {
            id: "campus-abbreviation",
            name: "abbreviation",
            label: "Campus Abbreviation",
            placeholder: "SN",
            hint: `Will be converted to uppercase: ${formData.abbreviation ? formData.abbreviation.toUpperCase() : ""}`,
        },
        {
            id: "campus-location",
            name: "location",
            label: "Location",
            placeholder: "933 Lucas Meyer street, Theresapark",
            optional: true,
        },
    ];

    const columns: AdminTableColumn<CampusData>[] = [
        {
            key: "id",
            label: "Campus ID",
            width: "w-[190px]",
            render: (val) => <IdCell id={String(val)} />,
        },
        { key: "name", label: "Campus Name", width: "w-[240px]" },
        {
            key: "abbreviation",
            label: "Abbreviation",
            width: "w-[120px]",
            render: (val) => (
                <Badge variant="secondary" className="font-semibold tracking-wide">
                    {String(val)}
                </Badge>
            ),
        },
        {
            key: "location",
            label: "Location",
            truncate: true,
        },
    ];

    const isFormValid = formData.name.trim() && formData.abbreviation.trim();

    return (
        <div className="w-full h-full flex flex-col items-center px-6">
            <div className="w-full max-w-[1400px] h-full flex flex-col">
                {/* Header with Search and Add Button */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                        <Input
                            type="search"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                loadCampuses(e.target.value, 1);
                            }}
                            disabled={isLoading}
                            className="pl-16 pr-6 bg-card border-none h-12 text-lg rounded-full shadow-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-muted-foreground/30 disabled:opacity-50"
                        />
                    </div>

                    <Button
                        onClick={handleAddOpen}
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
                    title="ADD NEW CAMPUS"
                    description="Add a new campus with name, abbreviation, and location."
                    fields={addFormFields}
                    formData={formData}
                    formErrors={formErrors}
                    onFormDataChange={(field, value) => setFormData({ ...formData, [field]: value })}
                    onSubmit={handleSave}
                    onCancel={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                    }}
                    submitLabel="Save"
                    isValid={isFormValid}
                />

                {/* Edit Dialog */}
                <FormModal
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    title="EDIT CAMPUS"
                    description="Edit campus details."
                    fields={addFormFields}
                    formData={formData}
                    formErrors={formErrors}
                    onFormDataChange={(field, value) => setFormData({ ...formData, [field]: value })}
                    onSubmit={handleSaveEdit}
                    onCancel={() => {
                        setIsEditDialogOpen(false);
                        setEditingItem(null);
                        resetForm();
                    }}
                    submitLabel="Save"
                    isValid={isFormValid}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    itemCount={selectedRows.size}
                    itemType="Campus"
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
