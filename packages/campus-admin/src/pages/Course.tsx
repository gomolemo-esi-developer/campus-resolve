import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    FormSelect,
    QUALIFICATION_TYPES_LIST,
    QUALIFICATION_TYPES,
    QUALIFICATION_ABBREVIATIONS,
    getQualificationDisplayName,
    getQualificationTabLabel,
    VALIDATION,
    ERROR_MESSAGES,
    TableTabButton,
} from "@/components/admin";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { ActionBar } from "@/components/admin/ActionBar";
import { Pagination } from "@/components/admin/Pagination";
import { ModalTabButton } from "@/components/admin/ModalTabButton";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useSearch } from "@/hooks/useSearch";
import { FormInputField } from "@/components/admin/FormInputField";
import { courseApi, ApiError } from "@/services/adminApi";

interface CourseData {
    id: string;
    code: string;
    name: string;
    departmentId: string;
    departmentName: string;
    facultyId: string;
    facultyName: string;
    qualificationType: string;
}

interface DepartmentOption {
    label: string;
    value: string;
    facultyId: string;
}

const validateForm = (data: Record<string, string>) => {
    const errors: Record<string, string> = {};
    if (!data.code?.trim()) errors.code = ERROR_MESSAGES.FIELD_REQUIRED;
    if (!data.name?.trim()) errors.name = ERROR_MESSAGES.FIELD_REQUIRED;
    if (!data.departmentId) errors.departmentId = ERROR_MESSAGES.FIELD_REQUIRED;
    return errors;
};

const SEARCHABLE_FIELDS: (keyof CourseData)[] = ["code", "name", "departmentName", "facultyName", "id"];

export default function Course() {
    const { toast } = useToast();
    const [data, setData] = useState<CourseData[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
    const [facultyOptions, setFacultyOptions] = useState<{ label: string; value: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeQualType, setActiveQualType] = useState<string>("HCert");
    const [activeModalTab, setActiveModalTab] = useState<string>("HCert");
    const [editingItem, setEditingItem] = useState<CourseData | null>(null);
    const tabListRef = useRef<HTMLDivElement>(null);

    const { selectedRows, toggleRow, toggleSelectAll, clearSelection } =
        useRowSelection();

    // Enrich course data with department and faculty names from loaded options
    const enrichedData = useMemo(() => {
        return data.map(course => ({
            ...course,
            departmentName: departmentOptions.find(d => d.value === course.departmentId)?.label || 'Unknown',
            facultyName: facultyOptions.find(f => f.value === course.facultyId)?.label || 'Unknown',
        }));
    }, [data, departmentOptions, facultyOptions]);

    const filteredByType = enrichedData.filter((item) => item.qualificationType === activeQualType);
    const { searchQuery, setSearchQuery, filteredData } = useSearch(filteredByType, SEARCHABLE_FIELDS);
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
        useFormManagement(
            { code: "", name: "", departmentId: "" },
            validateForm
        );

    // Load departments from backend
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
            const departments = (result.data || []).map((dept: any) => ({
                label: dept.name,
                value: dept.id,
                facultyId: dept.faculty_id,
            }));
            setDepartmentOptions(departments);
            console.log('[Course.loadDepartments] Loaded options:', departments);
        } catch (error) {
            console.error('[Course.loadDepartments] Error:', error);
            const message = error instanceof Error ? error.message : "Failed to load departments";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };

    // Load faculties from backend
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
            const faculties = (result.data || []).map((faculty: any) => ({
                label: faculty.name,
                value: faculty.id,
            }));
            setFacultyOptions(faculties);
            console.log('[Course.loadFaculties] Loaded options:', faculties);
        } catch (error) {
            console.error('[Course.loadFaculties] Error:', error);
        }
    };

    // Load courses from backend
    const loadCourses = async (
        qualType = activeQualType,
        search = searchQuery,
        page = 1
    ) => {
        try {
            setIsLoading(true);
            const result = await courseApi.list(
                qualType,
                '',
                search,
                page,
                10
            );
            setData(result.data);
            setCurrentPage(page);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to load courses";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Load departments and courses on component mount
    useEffect(() => {
        loadDepartments();
        loadFaculties();
        loadCourses();
    }, []);

    // Load courses when activeQualType changes
    useEffect(() => {
        loadCourses();
    }, [activeQualType]);

    // Keyboard navigation for modal tabs
    const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        const tabs = QUALIFICATION_TYPES_LIST;
        let newIndex = currentIndex;

        switch (e.key) {
            case "ArrowRight":
                e.preventDefault();
                newIndex = (currentIndex + 1) % tabs.length;
                break;
            case "ArrowLeft":
                e.preventDefault();
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case "Home":
                e.preventDefault();
                newIndex = 0;
                break;
            case "End":
                e.preventDefault();
                newIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        const tabButtons = tabListRef.current?.querySelectorAll("[role='tab']");
        (tabButtons?.[newIndex] as HTMLButtonElement)?.focus();
        setActiveModalTab(tabs[newIndex]);
    }, []);

    const handleAddOpen = () => {
        resetForm();
        setActiveModalTab(activeQualType);
        setIsAddDialogOpen(true);
    };

    const handleSave = async () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length === 0) {
            try {
                setIsLoading(true);
                // Get facultyId from department mapping
                const selectedDept = departmentOptions.find(d => d.value === formData.departmentId);
                const facultyId = selectedDept?.facultyId;

                if (!facultyId) {
                    toast({
                        title: "Error",
                        description: "Selected department does not have an associated faculty.",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                await courseApi.create({
                    code: formData.code,
                    name: formData.name,
                    departmentId: formData.departmentId,
                    facultyId: facultyId,
                    qualificationType: activeModalTab,
                });
                setIsAddDialogOpen(false);
                resetForm();
                toast({
                    title: "Course Added",
                    description: `${formData.code} has been successfully added.`,
                });
                await loadCourses();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to add course";
                toast({
                    title: "Error",
                    description: message,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEdit = () => {
        const selectedIndex = Array.from(selectedRows)[0];
        const item = paginatedData[selectedIndex];
        if (item) {
            setEditingItem(item);
            setFormData({
                code: item.code,
                name: item.name,
                departmentId: item.departmentId,
            });
            setActiveModalTab(item.qualificationType);
            setIsEditDialogOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        const errors = validateForm(formData);
        if (editingItem && Object.keys(errors).length === 0) {
            try {
                setIsLoading(true);
                // Get facultyId from department mapping
                const selectedDept = departmentOptions.find(d => d.value === formData.departmentId);
                const facultyId = selectedDept?.facultyId;

                if (!facultyId) {
                    toast({
                        title: "Error",
                        description: "Selected department does not have an associated faculty.",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                await courseApi.update(editingItem.id, {
                    code: formData.code,
                    name: formData.name,
                    departmentId: formData.departmentId,
                    facultyId: facultyId,
                    qualificationType: activeModalTab,
                });
                setIsEditDialogOpen(false);
                setEditingItem(null);
                resetForm();
                clearSelection();
                toast({
                    title: "Course Updated",
                    description: "The course has been successfully updated.",
                });
                await loadCourses();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to update course";
                toast({
                    title: "Error",
                    description: message,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const confirmDelete = async () => {
        const selectedIndices = Array.from(selectedRows);
        const idsToDelete = selectedIndices.map((i) => paginatedData[i]?.id).filter(Boolean);

        try {
            setIsLoading(true);
            if (idsToDelete.length === 1) {
                await courseApi.delete(idsToDelete[0]);
            } else {
                await courseApi.batchDelete(idsToDelete);
            }
            setIsDeleteDialogOpen(false);
            clearSelection();
            toast({
                title: "Courses Deleted",
                description: `${selectedRows.size} course(s) deleted.`,
            });
            await loadCourses();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete course(s)";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const columns: AdminTableColumn<CourseData>[] = [
        { key: "code", label: "Course Code", width: "w-32" },
        { key: "name", label: "Course Name" },
        {
            key: "departmentName",
            label: "Department",
            render: (val) => <Badge variant="secondary" className="bg-foreground text-background">{val || 'Unknown'}</Badge>,
        },
        {
            key: "facultyName",
            label: "Faculty",
            render: (val) => <Badge variant="outline">{val || 'Unknown'}</Badge>,
        },
    ];

    return (
        <div className="w-full h-full flex flex-col items-center px-6">
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
                                setCurrentPage(1);
                            }}
                            disabled={isLoading}
                            className="pl-16 pr-6 bg-card border-none h-12 text-lg rounded-full shadow-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-muted-foreground/30"
                        />
                    </div>

                    <Button
                        onClick={handleAddOpen}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-full pl-6 pr-2 h-12 shadow-lg shadow-primary/30"
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
                                ADD NEW COURSE
                            </DialogTitle>
                        </DialogHeader>

                        {/* Modal Tabs */}
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 px-6 border-b border-border overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Qualification type"
                        >
                            {QUALIFICATION_TYPES_LIST.map((qual, index) => (
                                <ModalTabButton
                                    key={qual}
                                    label={QUALIFICATION_ABBREVIATIONS[qual]}
                                    qualType={qual}
                                    isActive={activeModalTab === qual}
                                    onClick={() => setActiveModalTab(qual)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="course-code"
                                    label="Course Code"
                                    value={formData.code}
                                    onChange={(value) => setFormData({ ...formData, code: value })}
                                    placeholder="HCT101"
                                    error={formErrors.code}
                                />

                                <FormInputField
                                    id="course-name"
                                    label="Course Name"
                                    value={formData.name}
                                    onChange={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="IT Fundamentals"
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

                                <div className="flex justify-center gap-4 pt-6">
                                    <Button
                                        onClick={() => {
                                            setIsAddDialogOpen(false);
                                            resetForm();
                                        }}
                                        variant="outline"
                                        className="w-32 h-12 text-base font-semibold rounded-lg"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                                        disabled={!formData.code.trim() || !formData.name.trim() || !formData.departmentId || isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Save"
                                        )}
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
                                EDIT COURSE
                            </DialogTitle>
                        </DialogHeader>

                        {/* Modal Tabs */}
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 px-6 border-b border-border overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Qualification type"
                        >
                            {QUALIFICATION_TYPES_LIST.map((qual, index) => (
                                <ModalTabButton
                                    key={qual}
                                    label={QUALIFICATION_ABBREVIATIONS[qual]}
                                    qualType={qual}
                                    isActive={activeModalTab === qual}
                                    onClick={() => setActiveModalTab(qual)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="edit-course-code"
                                    label="Course Code"
                                    value={formData.code}
                                    onChange={(value) => setFormData({ ...formData, code: value })}
                                    placeholder="HCT101"
                                    error={formErrors.code}
                                />

                                <FormInputField
                                    id="edit-course-name"
                                    label="Course Name"
                                    value={formData.name}
                                    onChange={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="IT Fundamentals"
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

                                <div className="flex justify-center gap-4 pt-6">
                                    <Button
                                        onClick={() => {
                                            setIsEditDialogOpen(false);
                                            setEditingItem(null);
                                            resetForm();
                                        }}
                                        variant="outline"
                                        className="w-32 h-12 text-base font-semibold rounded-lg"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                                        disabled={!formData.code.trim() || !formData.name.trim() || !formData.departmentId || isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Save"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    itemCount={selectedRows.size}
                    itemType="Course"
                    onConfirm={confirmDelete}
                />

                {/* Table Container with Category Tabs */}
                <div className="bg-card rounded-lg shadow-sm flex flex-col h-full overflow-hidden relative">
                    {/* Qualification Type Tabs */}
                    <div
                        className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden tabs-scrollbar flex-shrink-0 px-6 pb-1"
                        role="tablist"
                        aria-label="Qualification type filter"
                    >
                        {QUALIFICATION_TYPES_LIST.map((qual) => (
                            <TableTabButton
                                key={qual}
                                label={QUALIFICATION_ABBREVIATIONS[qual]}
                                isActive={activeQualType === qual}
                                onClick={() => {
                                    setActiveQualType(qual);
                                    clearSelection();
                                    setCurrentPage(1);
                                    setSearchQuery("");
                                }}
                            />
                        ))}
                    </div>

                    {/* Table */}
                    <div className="px-6 pb-6 flex-1 flex flex-col overflow-hidden relative">
                        <AdminTable
                            columns={columns}
                            data={paginatedData}
                            selectedRows={selectedRows}
                            onRowToggle={toggleRow}
                            onSelectAll={() => toggleSelectAll(paginatedData.length)}
                        />
                        {isLoading && (
                            <div className="absolute inset-0 bg-background/30 flex items-center justify-center z-10 rounded">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    {selectedRows.size > 0 && (
                        <ActionBar
                            selectedCount={selectedRows.size}
                            onClear={clearSelection}
                            onEdit={selectedRows.size === 1 ? handleEdit : undefined}
                            onDelete={() => setIsDeleteDialogOpen(true)}
                        />
                    )}
                </div>

                {/* Pagination */}
                <div className="flex-shrink-0 bg-background">
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
