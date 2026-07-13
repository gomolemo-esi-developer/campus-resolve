import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    Pagination,
    ActionBar,
    DeleteConfirmDialog,
    FormModal,
    FormField,
    FormSelect,
    FormInputField,
    VALIDATION,
    ERROR_MESSAGES,
} from "@/components/admin";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useSearch } from "@/hooks/useSearch";
import { departmentApi, ApiError } from "@/services/adminApi";

interface FacultyOption {
    label: string;
    value: string;
}

interface DepartmentData {
    id: string;
    name: string;
    abbreviation: string;
    facultyId: string;
    facultyName: string;
}



const initialData: DepartmentData[] = [];

interface FormDataType {
    name: string;
    abbreviation: string;
    facultyId: string;
}

const SEARCHABLE_FIELDS: (keyof DepartmentData)[] = ["name", "abbreviation", "id"];

export default function Department() {
    const { toast } = useToast();
    const [data, setData] = useState<DepartmentData[]>(initialData);
    const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
    const [editingItem, setEditingItem] = useState<DepartmentData | null>(null);
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
        { name: "", abbreviation: "", facultyId: "" },
        validateForm
    );

    // Load faculties and departments on component mount
    useEffect(() => {
        loadFaculties();
        loadDepartments();
    }, []);

    const loadFaculties = async () => {
        try {
            const getAuthToken = () => {
                return localStorage.getItem('auth_token') || 'test-token-dev';
            };
            
            const response = await fetch('/api/admin/faculties?limit=1000', {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to load faculties');
            }
            
            const result = await response.json();
            const options = (result.data || []).map((faculty: any) => ({
                label: faculty.name,
                value: faculty.id,
            }));
            setFacultyOptions(options);
        } catch (error) {
            console.error('Error loading faculties:', error);
            toast({
                title: "Error",
                description: "Failed to load faculties from database",
                variant: "destructive",
            });
        }
    };

    const loadDepartments = async (search = "", page = 1) => {
        try {
            setIsLoading(true);
            const result = await departmentApi.list(search, page, 10);
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
                    description: "Failed to load departments",
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
        // Faculty is now mandatory
        if (!data.facultyId) {
            errors.facultyId = ERROR_MESSAGES.FIELD_REQUIRED;
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
            // Faculty is now mandatory - send as-is
            await departmentApi.create(formData);
            setIsAddDialogOpen(false);
            resetForm();
            toast({
                title: "Department Added",
                description: "The department has been successfully added.",
            });
            // Reload data from backend
            await loadDepartments(searchQuery);
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
                    description: "Failed to create department",
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
                facultyId: itemToEdit.facultyId,
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
            // Faculty is now mandatory - send as-is
            await departmentApi.update(editingItem.id, formData);
            setIsEditDialogOpen(false);
            setEditingItem(null);
            resetForm();
            setSelectedRows(new Set());
            toast({
                title: "Department Updated",
                description: "The department has been successfully updated.",
            });
            // Reload data from backend
            await loadDepartments(searchQuery);
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
                    description: "Failed to update department",
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
                await departmentApi.delete(idsToDelete[0]);
            } else {
                await departmentApi.batchDelete(idsToDelete);
            }
            setIsDeleteDialogOpen(false);
            setSelectedRows(new Set());
            toast({
                title: "Department Deleted",
                description: `${selectedIndices.length} department(s) have been successfully deleted.`,
                variant: "destructive",
            });
            // Reload data from backend
            await loadDepartments(searchQuery);
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
                    description: "Failed to delete department",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const columns: AdminTableColumn<DepartmentData>[] = [
        { key: "id", label: "Department ID", width: "w-32" },
        { key: "name", label: "Department Name" },
        { key: "abbreviation", label: "Abbreviation", width: "w-24" },
        {
            key: "facultyName",
            label: "Faculty",
            render: (val) => <Badge variant="outline">{val || 'Unknown'}</Badge>,
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
                                loadDepartments(e.target.value, 1);
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
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent
                        className="max-w-2xl max-h-[80vh] border-none shadow-lg flex flex-col"
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                    >
                        <DialogHeader className="space-y-4 px-6 pt-6 flex-shrink-0">
                            <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">
                                ADD DEPARTMENT
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="dept-name"
                                    label="Department Name"
                                    value={formData.name}
                                    onChange={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="Physics Department"
                                    error={formErrors.name}
                                />

                                <FormInputField
                                    id="dept-abbreviation"
                                    label="Department Abbreviation"
                                    value={formData.abbreviation}
                                    onChange={(value) => setFormData({ ...formData, abbreviation: value })}
                                    placeholder="PHY"
                                    error={formErrors.abbreviation}
                                />

                                <FormSelect
                                    label="Faculty"
                                    value={formData.facultyId}
                                    onChange={(value) => setFormData({ ...formData, facultyId: value })}
                                    options={facultyOptions}
                                    placeholder="Select Faculty"
                                    required
                                    searchable
                                    error={formErrors.facultyId}
                                />

                                <div className="flex justify-center gap-4 pt-6">
                                    <Button
                                        onClick={() => {
                                            setIsAddDialogOpen(false);
                                            resetForm();
                                        }}
                                        variant="outline"
                                        className="w-32 h-12 text-base font-semibold rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                                        disabled={!isFormValid}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent
                        className="max-w-2xl max-h-[80vh] border-none shadow-lg flex flex-col"
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                    >
                        <DialogHeader className="space-y-4 px-6 pt-6 flex-shrink-0">
                            <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">
                                EDIT DEPARTMENT
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="edit-dept-name"
                                    label="Department Name"
                                    value={formData.name}
                                    onChange={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="Physics Department"
                                    error={formErrors.name}
                                />

                                <FormInputField
                                    id="edit-dept-abbreviation"
                                    label="Department Abbreviation"
                                    value={formData.abbreviation}
                                    onChange={(value) => setFormData({ ...formData, abbreviation: value })}
                                    placeholder="PHY"
                                    error={formErrors.abbreviation}
                                />

                                <FormSelect
                                    label="Faculty"
                                    value={formData.facultyId}
                                    onChange={(value) => setFormData({ ...formData, facultyId: value })}
                                    options={facultyOptions}
                                    placeholder="Select Faculty"
                                    required
                                    searchable
                                    error={formErrors.facultyId}
                                />

                                <div className="flex justify-center gap-4 pt-6">
                                    <Button
                                        onClick={() => {
                                            setIsEditDialogOpen(false);
                                            setEditingItem(null);
                                            resetForm();
                                        }}
                                        variant="outline"
                                        className="w-32 h-12 text-base font-semibold rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                                        disabled={!isFormValid}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    itemCount={selectedRows.size}
                    itemType="Department"
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
