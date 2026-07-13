import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    DeleteConfirmDialog,
    ActionBar,
    Pagination,
    TableTabButton,
    FormSelect,
} from "@/components/admin";
import { FormInputField } from "@/components/admin/FormInputField";
import { ModalTabButton } from "@/components/admin/ModalTabButton";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useSearch } from "@/hooks/useSearch";
import { extracurricularApi, ApiError } from "@/services/adminApi";

type ActivityCategory = "Sports" | "Indigenous Activities" | "Religious" | "Social Justice" | "Student Governance";

const activityCategories: ActivityCategory[] = [
    "Sports",
    "Indigenous Activities",
    "Religious",
    "Social Justice",
    "Student Governance"
];

interface DepartmentOption {
    label: string;
    value: string;
}

interface ExtracurricularData {
    id: string;
    activity: string;
    category: ActivityCategory;
    departmentId: string | null;
    departmentName: string | null;
}

const validateForm = (data: Record<string, string>) => {
    const errors: Record<string, string> = {};
    if (!data.activity?.trim()) errors.activity = "Activity name is required";
    return errors;
};

const SEARCHABLE_FIELDS: (keyof ExtracurricularData)[] = ["activity", "departmentName"];

export default function Extracurricular() {
    const { toast } = useToast();
    const [data, setData] = useState<ExtracurricularData[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<ActivityCategory>("Sports");
    const [activeModalTab, setActiveModalTab] = useState<ActivityCategory>("Sports");
    const [editingItem, setEditingItem] = useState<ExtracurricularData | null>(null);
    const tabListRef = useRef<HTMLDivElement>(null);

    const { selectedRows, toggleRow, toggleSelectAll, clearSelection } =
        useRowSelection();

    const filteredByTab = data.filter((item) => item.category === activeTab);
    const { searchQuery, setSearchQuery, filteredData } = useSearch(filteredByTab, SEARCHABLE_FIELDS);
    const { currentPage, setCurrentPage, paginatedData } = usePagination(
        filteredData,
        10
    );

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
            { activity: "", category: "", departmentId: "" },
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
            const options = (result.data || []).map((dept: any) => ({
                label: dept.name,
                value: dept.id,
            }));
            setDepartmentOptions(options);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    // Load extracurricular activities from backend
    const loadActivities = async (
        category = activeTab,
        search = searchQuery,
        page = 1
    ) => {
        try {
            setIsLoading(true);
            const result = await extracurricularApi.list(
                category,
                search,
                page,
                10
            );
            setData(result.data);
            setCurrentPage(page);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to load activities";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Load departments and activities on component mount and when activeTab changes
    useEffect(() => {
        loadDepartments();
        loadActivities();
    }, [activeTab]);

    // Keyboard navigation for modal tabs
    const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        const tabs = activityCategories;
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
        setActiveModalTab(activeTab);
        setIsAddDialogOpen(true);
    };

    const handleSave = async () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length === 0) {
            try {
                setIsLoading(true);
                await extracurricularApi.create({
                    activity: formData.activity,
                    category: activeModalTab,
                    departmentId: formData.departmentId || null,
                });
                setIsAddDialogOpen(false);
                resetForm();
                toast({
                    title: "Activity Added",
                    description: `${formData.activity} has been successfully added.`,
                });
                await loadActivities();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to add activity";
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
                activity: item.activity,
                category: item.category,
                departmentId: item.departmentId || "",
            });
            setActiveModalTab(item.category);
            setIsEditDialogOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        const errors = validateForm(formData);
        if (editingItem && Object.keys(errors).length === 0) {
            try {
                setIsLoading(true);
                await extracurricularApi.update(editingItem.id, {
                    activity: formData.activity,
                    category: activeModalTab,
                    departmentId: formData.departmentId || null,
                });
                setIsEditDialogOpen(false);
                setEditingItem(null);
                resetForm();
                clearSelection();
                toast({
                    title: "Activity Updated",
                    description: "The activity has been successfully updated.",
                });
                await loadActivities();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to update activity";
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
                await extracurricularApi.delete(idsToDelete[0]);
            } else {
                await extracurricularApi.batchDelete(idsToDelete);
            }
            setIsDeleteDialogOpen(false);
            clearSelection();
            toast({
                title: "Activities Deleted",
                description: `${selectedRows.size} activity(ies) have been successfully deleted.`,
                variant: "destructive",
            });
            await loadActivities();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete activities";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const columns: AdminTableColumn<ExtracurricularData>[] = [
        { key: "activity", label: "Activity Name" },
        {
            key: "departmentName",
            label: "Department",
            width: "w-40",
            render: (value, row) => {
                // Use departmentName if available, otherwise lookup by departmentId
                let displayName = value;

                if (!displayName && row.departmentId) {
                    const dept = departmentOptions.find(d => d.value === row.departmentId);
                    displayName = dept?.label || "Unknown";
                }

                if (!displayName) {
                    return <span className="text-muted-foreground text-sm italic">Not assigned</span>;
                }

                return (
                    <Badge variant="secondary" className="bg-foreground text-background">
                        {displayName}
                    </Badge>
                );
            },
        },
    ];

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
                                setCurrentPage(1);
                            }}
                            className="pl-16 pr-6 bg-card border-none h-12 text-lg rounded-full shadow-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-muted-foreground/30"
                        />
                    </div>

                    <Button
                        onClick={handleAddOpen}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-full pl-6 pr-2 h-12 shadow-lg shadow-primary/30"
                    >
                        <span className="font-medium">Add</span>
                        <div className="bg-white rounded-full p-2">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
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
                                ADD EXTRACURRICULAR
                            </DialogTitle>
                        </DialogHeader>

                        {/* Modal Tabs */}
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 px-6 border-b border-border overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Extracurricular category"
                        >
                            {activityCategories.map((category, index) => (
                                <ModalTabButton
                                    key={category}
                                    qualType={category}
                                    isActive={activeModalTab === category}
                                    onClick={() => setActiveModalTab(category)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="add-activity-name"
                                    label="Activity Name"
                                    value={formData.activity}
                                    onChange={(value) => setFormData({ ...formData, activity: value })}
                                    placeholder="Enter activity name"
                                    error={formErrors.activity}
                                />

                                <FormSelect
                                    label="Department (Optional)"
                                    value={formData.departmentId}
                                    onChange={(value) => setFormData({ ...formData, departmentId: value })}
                                    options={departmentOptions}
                                    placeholder="Select department"
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
                                        disabled={!formData.activity.trim() || isLoading}
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
                                EDIT EXTRACURRICULAR
                            </DialogTitle>
                        </DialogHeader>

                        {/* Modal Tabs */}
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 px-6 border-b border-border overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Extracurricular category"
                        >
                            {activityCategories.map((category, index) => (
                                <ModalTabButton
                                    key={category}
                                    qualType={category}
                                    isActive={activeModalTab === category}
                                    onClick={() => setActiveModalTab(category)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="edit-activity-name"
                                    label="Activity Name"
                                    value={formData.activity}
                                    onChange={(value) => setFormData({ ...formData, activity: value })}
                                    placeholder="Enter activity name"
                                    error={formErrors.activity}
                                />

                                <FormSelect
                                    label="Department (Optional)"
                                    value={formData.departmentId}
                                    onChange={(value) => setFormData({ ...formData, departmentId: value })}
                                    options={departmentOptions}
                                    placeholder="Select department"
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
                                        disabled={!formData.activity.trim() || isLoading}
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
                    itemType="Extracurricular"
                    onConfirm={confirmDelete}
                />

                {/* Table Container with Tabs */}
                <div className="bg-card rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                    {/* Category Tabs */}
                    <div
                        className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden tabs-scrollbar flex-shrink-0 px-6 pb-2"
                        role="tablist"
                        aria-label="Category filter"
                    >
                        {activityCategories.map((category) => (
                            <TableTabButton
                                key={category}
                                label={category}
                                isActive={activeTab === category}
                                onClick={() => {
                                    setActiveTab(category);
                                    clearSelection();
                                    setCurrentPage(1);
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
                <div className=" flex-shrink-0 bg-background">
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
