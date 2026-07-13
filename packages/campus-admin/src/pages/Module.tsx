import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    Pagination,
    ActionBar,
    DeleteConfirmDialog,
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
import { moduleApi, ApiError, courseApi, departmentApi } from "@/services/adminApi";

interface ModuleData {
    id: string;
    code: string;
    name: string;
    courseId: string;
    courseName: string;
    departmentId: string;
    departmentName: string;
    facultyId: string;
    facultyName: string;
}

interface DepartmentOption {
    label: string;
    value: string;
    facultyId: string;
}

interface CourseOption {
    label: string;
    value: string;
    departmentId: string;
}

const initialData: ModuleData[] = [];

interface FormDataType {
    code: string;
    name: string;
    courseId: string;
    departmentId: string;
}

const SEARCHABLE_FIELDS: (keyof ModuleData)[] = ["name", "code", "courseName", "departmentName", "id"];

export default function Module() {
    const { toast } = useToast();
    const [data, setData] = useState<ModuleData[]>(initialData);
    const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
    const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
    const [editingItem, setEditingItem] = useState<ModuleData | null>(null);
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
        { code: "", name: "", courseId: "", departmentId: "" },
        validateForm
    );

    // Load dropdowns and data from backend on component mount
    useEffect(() => {
        loadDepartments();
        loadCourses();
        loadModules();
    }, []);

    const loadDepartments = async () => {
        try {
            const getAuthToken = () => {
                return localStorage.getItem('auth_token') || 'test-token-dev';
            };

            const response = await fetch('/api/admin/departments?limit=1000', {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load departments');
            }

            const result = await response.json();
            const options = (result.data || []).map((dept: any) => ({
                label: dept.name,
                value: dept.id,
                facultyId: dept.faculty_id,
            }));
            setDepartmentOptions(options);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadCourses = async () => {
        try {
            const getAuthToken = () => {
                return localStorage.getItem('auth_token') || 'test-token-dev';
            };

            const response = await fetch('/api/admin/courses?limit=1000', {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load courses');
            }

            const result = await response.json();
            const options = (result.data || []).map((course: any) => ({
                label: `${course.code} - ${course.name}`,
                value: course.id,
                departmentId: course.department_id,
            }));
            setCourseOptions(options);
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    };

    const loadModules = async (search = "", page = 1) => {
        try {
            setIsLoading(true);
            const result = await moduleApi.list('', '', search, page, 10);
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
                    description: "Failed to load modules",
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

        if (!data.code.trim()) {
            errors.code = ERROR_MESSAGES.FIELD_REQUIRED;
        }
        if (!data.name.trim()) {
            errors.name = ERROR_MESSAGES.FIELD_REQUIRED;
        }
        if (!data.courseId) {
            errors.courseId = ERROR_MESSAGES.FIELD_REQUIRED;
        }
        if (!data.departmentId) {
            errors.departmentId = ERROR_MESSAGES.FIELD_REQUIRED;
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
            await moduleApi.create({
                code: formData.code,
                name: formData.name,
                courseId: formData.courseId,
                departmentId: formData.departmentId,
            });
            setIsAddDialogOpen(false);
            resetForm();
            toast({
                title: "Module Added",
                description: `${formData.code} - ${formData.name} has been successfully added.`,
            });
            // Reload data from backend
            await loadModules(searchQuery);
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
                    description: "Failed to create module",
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
                code: itemToEdit.code,
                name: itemToEdit.name,
                courseId: itemToEdit.courseId,
                departmentId: itemToEdit.departmentId,
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
            await moduleApi.update(editingItem.id, {
                code: formData.code,
                name: formData.name,
                courseId: formData.courseId,
                departmentId: formData.departmentId,
            });
            setIsEditDialogOpen(false);
            setEditingItem(null);
            resetForm();
            setSelectedRows(new Set());
            toast({
                title: "Module Updated",
                description: `${formData.code} - ${formData.name} has been successfully updated.`,
            });
            // Reload data from backend
            await loadModules(searchQuery);
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
                    description: "Failed to update module",
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
                await moduleApi.delete(idsToDelete[0]);
            } else {
                await moduleApi.batchDelete(idsToDelete);
            }
            setIsDeleteDialogOpen(false);
            setSelectedRows(new Set());
            toast({
                title: "Module Deleted",
                description: `${selectedIndices.length} module(s) have been successfully deleted.`,
                variant: "destructive",
            });
            // Reload data from backend
            await loadModules(searchQuery);
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
                    description: "Failed to delete module",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const columns: AdminTableColumn<ModuleData>[] = [
        { key: "code", label: "Module Code", width: "w-24" },
        { key: "name", label: "Module Name", width: "flex-1 min-w-[200px]" },
        {
            key: "courseName",
            label: "Course",
            width: "w-32",
            render: (value) => (
                <Badge variant="secondary" className="bg-foreground text-background">
                    {value || "Unknown"}
                </Badge>
            ),
        },
        {
            key: "departmentName",
            label: "Department",
            width: "w-36",
            render: (value) => (
                <Badge variant="secondary" className="bg-foreground text-background">
                    {value || "Unknown"}
                </Badge>
            ),
        },
        {
            key: "facultyName",
            label: "Faculty",
            width: "w-32",
            render: (value) => (
                <Badge variant="outline">
                    {value || "Unknown"}
                </Badge>
            ),
        },
    ];

    const isFormValid = formData.code.trim() && formData.name.trim() && formData.courseId && formData.departmentId;

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
                                loadModules(e.target.value, 1);
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
                                ADD MODULE
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="module-code"
                                    label="Module Code"
                                    value={formData.code}
                                    onChange={(value) => setFormData({ ...formData, code: value })}
                                    placeholder="PRG101"
                                    error={formErrors.code}
                                />

                                <FormInputField
                                    id="module-name"
                                    label="Module Name"
                                    value={formData.name}
                                    onChange={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="Introduction to Programming"
                                    error={formErrors.name}
                                />

                                <FormSelect
                                    label="Department"
                                    value={formData.departmentId}
                                    onChange={(value) => setFormData({ ...formData, departmentId: value })}
                                    options={departmentOptions}
                                    placeholder="Select Department"
                                    required
                                    error={formErrors.departmentId}
                                />

                                <FormSelect
                                    label="Course"
                                    value={formData.courseId}
                                    onChange={(value) => setFormData({ ...formData, courseId: value })}
                                    options={courseOptions}
                                    placeholder="Select Course"
                                    required
                                    error={formErrors.courseId}
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
                                EDIT MODULE
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="edit-module-code"
                                    label="Module Code"
                                    value={formData.code}
                                    onChange={(value) => setFormData({ ...formData, code: value })}
                                    placeholder="PRG101"
                                    error={formErrors.code}
                                />

                                <FormInputField
                                    id="edit-module-name"
                                    label="Module Name"
                                    value={formData.name}
                                    onChange={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="Introduction to Programming"
                                    error={formErrors.name}
                                />

                                <FormSelect
                                    label="Department"
                                    value={formData.departmentId}
                                    onChange={(value) => setFormData({ ...formData, departmentId: value })}
                                    options={departmentOptions}
                                    placeholder="Select Department"
                                    required
                                    error={formErrors.departmentId}
                                />

                                <FormSelect
                                    label="Course"
                                    value={formData.courseId}
                                    onChange={(value) => setFormData({ ...formData, courseId: value })}
                                    options={courseOptions}
                                    placeholder="Select Course"
                                    required
                                    error={formErrors.courseId}
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
                    itemType="Module"
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
