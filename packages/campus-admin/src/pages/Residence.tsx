import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    IdCell,
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
import { generateId, ID_PREFIXES } from "@/lib/idGenerator";
import { residenceApi, ApiError, campusApi, staffApi } from "@/services/adminApi";
import { Loader2 } from "lucide-react";

type CampusLocation = "Arts" | "Arcadia" | "Emalahleni" | "Polokwane" | "Pretoria" | "Soshanguve South" | "Soshanguve North";

const campusLocations: CampusLocation[] = [
    "Arts",
    "Arcadia",
    "Emalahleni",
    "Polokwane",
    "Pretoria",
    "Soshanguve South",
    "Soshanguve North"
];

// Residence type and staff options will be loaded from database
interface ResidenceTypeOption {
    label: string;
    value: string;
}

interface StaffInfo {
    id: string;
    name: string;
    staffId: string;
}

interface ResidenceData {
    id: string;
    residenceId: string;
    residence: string;
    address: string;
    residenceType: string;
    manager?: string;
    campus: CampusLocation;
    campusId: string;
    capacity?: number;
    currentOccupancy?: number;
}

// Initial state - will be populated from backend
const initialData: ResidenceData[] = [];

const validateForm = (data: Record<string, string>) => {
    const errors: Record<string, string> = {};
    // residenceId is auto-generated, no need to validate
    if (!data.residence?.trim()) errors.residence = "Residence name is required";
    if (!data.address?.trim()) errors.address = "Address is required";
    if (!data.residenceType) errors.residenceType = "Residence type is required";
    return errors;
};

const SEARCHABLE_FIELDS: (keyof ResidenceData)[] = ["residence", "address", "residenceId"];

export default function Residence() {
    const { toast } = useToast();
    const [data, setData] = useState<ResidenceData[]>(initialData);
    const [residenceTypeOptions, setResidenceTypeOptions] = useState<ResidenceTypeOption[]>([]);
    const [staffOptions, setStaffOptions] = useState<{ label: string; value: string; staffId: string }[]>([]);
    const [campusMap, setCampusMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<CampusLocation>("Arts");
    const [activeModalTab, setActiveModalTab] = useState<CampusLocation>("Arts");
    const [editingItem, setEditingItem] = useState<ResidenceData | null>(null);
    const tabListRef = useRef<HTMLDivElement>(null);

    const { selectedRows, toggleRow, toggleSelectAll, clearSelection } =
        useRowSelection();

    // Filter by campusId (UUID) to handle both old data (campus name) and new data (campus_id only)
    const campusIdForTab = campusMap[activeTab];
    const filteredByTab = campusIdForTab 
        ? data.filter((item) => item.campusId === campusIdForTab || item.campus === activeTab)
        : data;
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
            { residenceId: "", residence: "", address: "", residenceType: "" },
            validateForm
        );

    // Load residences data from backend - load all and filter client-side to handle both old and new records
    const loadResidences = async (campus = activeTab, search = "", page = 1) => {
        try {
            setIsLoading(true);
            // Load all residences (no campus filter) since new records may have campus=null
            const result = await residenceApi.list("", "", search, page, 100);
            setData(result.data);
            setCurrentPage(page);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to load residences";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Load residences on component mount and when activeTab changes
    useEffect(() => {
        loadResidenceTypes();
        loadStaff();
        loadCampuses();
        loadResidences(activeTab);
    }, [activeTab]);

    const loadResidenceTypes = async () => {
        try {
            // Hardcoded residence types for now
            // Can be extended to fetch from database if needed
            const options: ResidenceTypeOption[] = [
                { label: "On-Campus", value: "On-Campus" },
                { label: "Off-Campus", value: "Off-Campus" },
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
                { label: "Mixed", value: "Mixed" },
                { label: "Postgraduate", value: "Postgraduate" },
            ];
            setResidenceTypeOptions(options);
        } catch (error) {
            console.error('Error loading residence types:', error);
        }
    };

    const loadStaff = async () => {
        try {
            const response = await staffApi.list('', '', '', 1, 100);
            const options = (response.data || []).map((staff: any) => ({
                label: `${staff.firstName} ${staff.lastName} (${staff.staffId})`,
                value: staff.id,
                staffId: staff.staffId,
            }));
            setStaffOptions(options);
        } catch (error) {
            console.error('Error loading staff:', error);
        }
    };

    const loadCampuses = async () => {
        try {
            const result = await campusApi.list('', 1, 1000);
            const map: Record<string, string> = {};
            result.data.forEach((campus) => {
                // Map both the full name and the short name (for compatibility)
                map[campus.name] = campus.id;
                // Also map the short name (e.g., "Arts" -> uuid)
                const shortName = campus.name.replace(' Campus', '');
                map[shortName] = campus.id;
            });
            setCampusMap(map);
        } catch (error) {
            console.error('Error loading campuses:', error);
        }
    };

    // Keyboard navigation for modal tabs
    const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        const tabs = campusLocations;
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
        const newResidenceId = generateId(ID_PREFIXES.RESIDENCE);
        resetForm();
        setFormData({
            residenceId: newResidenceId,
            residence: "",
            address: "",
            residenceType: ""
        });
        setActiveModalTab(activeTab);
        setIsAddDialogOpen(true);
    };

    const handleSave = async () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length === 0) {
            try {
                setIsLoading(true);

                const campusId = campusMap[activeModalTab] || activeModalTab;
                await residenceApi.create({
                    residenceId: formData.residenceId,
                    residence: formData.residence,
                    address: formData.address,
                    residenceType: formData.residenceType,
                    manager: null, // Manager is auto-assigned when a staff member selects this residence
                    campusId: campusId,
                    campus: '' // Will be populated from database based on campusId
                });
                
                setIsAddDialogOpen(false);
                resetForm();
                toast({
                    title: "Residence Added",
                    description: `${formData.residence} has been successfully added.`,
                });
                
                // Reload residence data from backend
                await loadResidences(activeModalTab);
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to create residence";
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
                residenceId: item.residenceId,
                residence: item.residence,
                address: item.address,
                residenceType: item.residenceType,
            });
            // Use campus name if available, otherwise try to find it from campusId
            const campusTab = item.campus || activeTab;
            setActiveModalTab(campusTab as CampusLocation);
            setIsEditDialogOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        const errors = validateForm(formData);
        if (editingItem && Object.keys(errors).length === 0) {
            try {
                setIsLoading(true);

                // Keep the original campus - don't change it during update
                const campusId = editingItem.campusId || campusMap[editingItem.campus] || editingItem.campus;
                await residenceApi.update(editingItem.id, {
                    residence: formData.residence,
                    address: formData.address,
                    residenceType: formData.residenceType,
                    campusId: campusId,
                });

                setIsEditDialogOpen(false);
                setEditingItem(null);
                resetForm();
                clearSelection();
                toast({
                    title: "Residence Updated",
                    description: `${formData.residence} has been successfully updated.`,
                });
                
                // Reload residence data from backend
                await loadResidences(activeTab);
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to update residence";
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
        try {
            setIsLoading(true);
            const selectedIndices = Array.from(selectedRows);
            const itemsToDelete = selectedIndices.map((idx) => paginatedData[idx]);
            const idsToDelete = itemsToDelete.map((item) => item.id);
            const countDeleted = selectedRows.size;

            // Delete from backend first
            if (idsToDelete.length > 1) {
                await residenceApi.batchDelete(idsToDelete);
            } else {
                await residenceApi.delete(idsToDelete[0]);
            }

            setIsDeleteDialogOpen(false);
            clearSelection();
            toast({
                title: "Residence Deleted",
                description: `${countDeleted} residence(s) have been successfully deleted.`,
            });

            // Reload residence data from backend
            await loadResidences(activeTab);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete residence";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const columns: AdminTableColumn<ResidenceData>[] = [
        {
            key: "residenceId",
            label: "Residence ID",
            width: "w-[190px]",
            render: (val) => <IdCell id={String(val)} />,
        },
        { key: "residence", label: "Residence Name", width: "w-[220px]" },
        {
            key: "residenceType",
            label: "Type",
            width: "w-[140px]",
            nowrap: true,
            render: (val) => (
                <Badge variant="secondary" className="whitespace-nowrap font-semibold tracking-wide">
                    {String(val)}
                </Badge>
            ),
        },
        { key: "address", label: "Address", width: "w-[260px]", truncate: true },
        {
            key: "manager",
            label: "Manager",
            render: (val) => {
                const staff = staffOptions.find(s => s.staffId === val);
                return staff ? staff.label : val || '—';
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
                                ADD RESIDENCE
                            </DialogTitle>
                        </DialogHeader>

                        {/* Modal Tabs */}
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 px-6 border-b border-border overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Campus location"
                        >
                            {campusLocations.map((campus, index) => (
                                <ModalTabButton
                                    key={campus}
                                    qualType={campus}
                                    isActive={activeModalTab === campus}
                                    onClick={() => setActiveModalTab(campus)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="add-residence-id"
                                    label="Residence ID"
                                    value={formData.residenceId}
                                    disabled
                                    placeholder="Auto-generated"
                                />

                                <FormInputField
                                    id="add-residence-name"
                                    label="Residence Name"
                                    value={formData.residence}
                                    onChange={(value) => setFormData({ ...formData, residence: value })}
                                    placeholder="Enter residence name"
                                    error={formErrors.residence}
                                />

                                <FormInputField
                                    id="add-residence-address"
                                    label="Address"
                                    value={formData.address}
                                    onChange={(value) => setFormData({ ...formData, address: value })}
                                    placeholder="Enter address"
                                    error={formErrors.address}
                                />

                                <FormSelect
                                    label="Residence Type"
                                    value={formData.residenceType}
                                    onChange={(value) => setFormData({ ...formData, residenceType: value })}
                                    options={residenceTypeOptions}
                                    placeholder="Select residence type"
                                    required
                                    error={formErrors.residenceType}
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
                                        disabled={!formData.residence.trim() || !formData.address.trim() || !formData.residenceType}
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
                                EDIT RESIDENCE
                            </DialogTitle>
                        </DialogHeader>

                        {/* Modal Tabs */}
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 px-6 border-b border-border overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Campus location"
                        >
                            {campusLocations.map((campus, index) => (
                                <ModalTabButton
                                    key={campus}
                                    qualType={campus}
                                    isActive={activeModalTab === campus}
                                    onClick={() => setActiveModalTab(campus)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="px-6 pb-6 overflow-y-auto modal-content-scroll flex-1">
                            <div className="py-6 space-y-6">
                                <FormInputField
                                    id="edit-residence-id"
                                    label="Residence ID"
                                    value={formData.residenceId}
                                    onChange={(value) => setFormData({ ...formData, residenceId: value })}
                                    placeholder="Enter residence ID"
                                    error={formErrors.residenceId}
                                />

                                <FormInputField
                                    id="edit-residence-name"
                                    label="Residence Name"
                                    value={formData.residence}
                                    onChange={(value) => setFormData({ ...formData, residence: value })}
                                    placeholder="Enter residence name"
                                    error={formErrors.residence}
                                />

                                <FormInputField
                                    id="edit-residence-address"
                                    label="Address"
                                    value={formData.address}
                                    onChange={(value) => setFormData({ ...formData, address: value })}
                                    placeholder="Enter address"
                                    error={formErrors.address}
                                />

                                <FormSelect
                                    label="Residence Type"
                                    value={formData.residenceType}
                                    onChange={(value) => setFormData({ ...formData, residenceType: value })}
                                    options={residenceTypeOptions}
                                    placeholder="Select residence type"
                                    required
                                    error={formErrors.residenceType}
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
                                        disabled={!formData.residenceId.trim() || !formData.residence.trim() || !formData.address.trim() || !formData.residenceType}
                                    >
                                        Save
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
                    itemType="Residence"
                    onConfirm={confirmDelete}
                />

                {/* Table Container with Tabs */}
                <div className="bg-card rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                    {/* Campus Tabs */}
                    <div
                        className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden tabs-scrollbar flex-shrink-0 px-6 pb-2"
                        role="tablist"
                        aria-label="Campus filter"
                    >
                        {campusLocations.map((campus) => (
                            <TableTabButton
                                key={campus}
                                label={campus}
                                isActive={activeTab === campus}
                                onClick={() => {
                                    setActiveTab(campus);
                                    clearSelection();
                                    setCurrentPage(1);
                                }}
                            />
                        ))}
                    </div>

                    {/* Table */}
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
                            onSelectAll={() => toggleSelectAll(paginatedData.length)}
                        />
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
