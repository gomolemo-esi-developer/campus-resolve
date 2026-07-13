import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    Pagination,
    ActionBar,
    DeleteConfirmDialog,
    VALIDATION,
    ERROR_MESSAGES,
} from "@/components/admin";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useState } from "react";

interface TestData {
    id: string;
    name: string;
    abbreviation: string;
    location: string;
}

const initialData: TestData[] = [
    {
        id: "1234567",
        name: "Test Record 1",
        abbreviation: "TR1",
        location: "Location 1",
    },
    {
        id: "1234568",
        name: "Test Record 2",
        abbreviation: "TR2",
        location: "Location 2",
    },
    {
        id: "1234569",
        name: "Test Record 3",
        abbreviation: "TR3",
        location: "Location 3",
    },
];

interface FormDataType {
    name: string;
    abbreviation: string;
    location: string;
}

export default function RefactorNonTabbed() {
    const { toast } = useToast();
    const [data, setData] = useState<TestData[]>(initialData);
    const [editingItem, setEditingItem] = useState<TestData | null>(null);

    // Hooks
    const { selectedRows, toggleRow, toggleSelectAll, clearSelection, setSelectedRows } = useRowSelection();
    const { currentPage, setCurrentPage, paginatedData } = usePagination(data, 10);
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

    const handleSave = () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const newId = Math.floor(Math.random() * 10000000) + "TEST";
        const newRecord: TestData = {
            id: newId,
            ...formData,
        };

        setData([...data, newRecord]);
        setIsAddDialogOpen(false);
        resetForm();
        toast({
            title: "Record Added",
            description: "The record has been successfully added.",
        });
    };

    const handleEdit = () => {
        const selectedIndex = Array.from(selectedRows)[0];
        const itemToEdit = data[selectedIndex];
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

    const handleSaveEdit = () => {
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const updatedData = data.map((item) =>
            item.id === editingItem?.id ? { ...item, ...formData } : item
        );

        setData(updatedData);
        setIsEditDialogOpen(false);
        setEditingItem(null);
        resetForm();
        setSelectedRows(new Set());
        toast({
            title: "Record Updated",
            description: "The record has been successfully updated.",
        });
    };

    const confirmDelete = () => {
        const selectedIndices = Array.from(selectedRows);
        const updatedData = data.filter((_, index) => !selectedIndices.includes(index));
        setData(updatedData);
        setIsDeleteDialogOpen(false);
        setSelectedRows(new Set());
        toast({
            title: "Record Deleted",
            description: `${selectedIndices.length} record(s) have been successfully deleted.`,
            variant: "destructive",
        });
    };

    const isFormValid = formData.name.trim() !== "" && formData.abbreviation.trim() !== "";

    const columns: AdminTableColumn<TestData>[] = [
        { key: "id", label: "ID", width: "w-32" },
        { key: "name", label: "Name" },
        { key: "abbreviation", label: "Abbreviation", width: "w-24" },
        { key: "location", label: "Location" },
    ];

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

                <div className="relative">
                    {/* Add Dialog */}
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogContent
                            className="max-w-2xl border-none shadow-lg max-h-[85vh] overflow-y-auto modal-content-scroll"
                            style={{ backgroundColor: 'hsl(var(--card))' }}
                            aria-describedby="add-record-description"
                        >
                            <DialogHeader className="space-y-4 px-6 pt-6">
                                <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">
                                    ADD RECORD
                                </DialogTitle>
                                <p id="add-record-description" className="sr-only">
                                    Add a new record to the table.
                                </p>
                            </DialogHeader>

                            <div className="px-6 pb-6">
                                <div className="py-6 space-y-6">
                                    <div>
                                        <Label htmlFor="add-name" className="text-foreground text-base">
                                            Name
                                        </Label>
                                        <Input
                                            id="add-name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Enter name"
                                            className={`h-12 border-2 rounded-lg text-base ${formErrors.name
                                                    ? "border-destructive focus-visible:border-destructive"
                                                    : "border-muted/40 focus-visible:border-primary/60"
                                                }`}
                                        />
                                        {formErrors.name && (
                                            <p className="text-destructive text-sm mt-1">{formErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="add-abbreviation" className="text-foreground text-base">
                                            Abbreviation
                                        </Label>
                                        <Input
                                            id="add-abbreviation"
                                            value={formData.abbreviation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, abbreviation: e.target.value })
                                            }
                                            placeholder="TR"
                                            className={`h-12 border-2 rounded-lg text-base ${formErrors.abbreviation
                                                    ? "border-destructive focus-visible:border-destructive"
                                                    : "border-muted/40 focus-visible:border-primary/60"
                                                }`}
                                        />
                                        {formErrors.abbreviation && (
                                            <p className="text-destructive text-sm mt-1">
                                                {formErrors.abbreviation}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="add-location" className="text-foreground text-base">
                                            Location (Optional)
                                        </Label>
                                        <Input
                                            id="add-location"
                                            value={formData.location}
                                            onChange={(e) =>
                                                setFormData({ ...formData, location: e.target.value })
                                            }
                                            placeholder="Enter location"
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

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
                            className="max-w-2xl border-none shadow-lg max-h-[85vh] overflow-y-auto modal-content-scroll"
                            style={{ backgroundColor: 'hsl(var(--card))' }}
                            aria-describedby="edit-record-description"
                        >
                            <DialogHeader className="space-y-4 px-6 pt-6">
                                <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">
                                    EDIT RECORD
                                </DialogTitle>
                                <p id="edit-record-description" className="sr-only">
                                    Edit record details.
                                </p>
                            </DialogHeader>

                            <div className="px-6 pb-6">
                                <div className="py-6 space-y-6">
                                    <div>
                                        <Label htmlFor="edit-name" className="text-foreground text-base">
                                            Name
                                        </Label>
                                        <Input
                                            id="edit-name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Enter name"
                                            className={`h-12 border-2 rounded-lg text-base ${formErrors.name
                                                    ? "border-destructive focus-visible:border-destructive"
                                                    : "border-muted/40 focus-visible:border-primary/60"
                                                }`}
                                        />
                                        {formErrors.name && (
                                            <p className="text-destructive text-sm mt-1">{formErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="edit-abbreviation" className="text-foreground text-base">
                                            Abbreviation
                                        </Label>
                                        <Input
                                            id="edit-abbreviation"
                                            value={formData.abbreviation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, abbreviation: e.target.value })
                                            }
                                            placeholder="TR"
                                            className={`h-12 border-2 rounded-lg text-base ${formErrors.abbreviation
                                                    ? "border-destructive focus-visible:border-destructive"
                                                    : "border-muted/40 focus-visible:border-primary/60"
                                                }`}
                                        />
                                        {formErrors.abbreviation && (
                                            <p className="text-destructive text-sm mt-1">
                                                {formErrors.abbreviation}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="edit-location" className="text-foreground text-base">
                                            Location (Optional)
                                        </Label>
                                        <Input
                                            id="edit-location"
                                            value={formData.location}
                                            onChange={(e) =>
                                                setFormData({ ...formData, location: e.target.value })
                                            }
                                            placeholder="Enter location"
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

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
                        itemType="Record"
                        onConfirm={confirmDelete}
                    />

                    {/* Table Container */}
                    <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col h-full overflow-hidden">
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

                        {/* Pagination */}
                        <div className="flex-shrink-0 bg-background border-t border-border">
                            <Pagination
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                totalItems={data.length}
                                itemsPerPage={10}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
