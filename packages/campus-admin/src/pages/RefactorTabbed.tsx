import { useState, useRef } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Pagination,
    ActionBar,
    ModalTabButton,
    DeleteConfirmDialog,
} from "@/components/admin";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Category = "Category A" | "Category B" | "Category C";

const categories: Category[] = [
    "Category A",
    "Category B",
    "Category C"
];

interface TestData {
    id: number;
    name: string;
    code: string;
    description: string;
    category: Category;
}

const initialDummyData: TestData[] = [
    { id: 1, name: "Test Item 1", code: "T001", description: "Description 1", category: "Category A" },
    { id: 2, name: "Test Item 2", code: "T002", description: "Description 2", category: "Category A" },
    { id: 3, name: "Test Item 3", code: "T003", description: "Description 3", category: "Category B" },
    { id: 4, name: "Test Item 4", code: "T004", description: "Description 4", category: "Category B" },
    { id: 5, name: "Test Item 5", code: "T005", description: "Description 5", category: "Category C" },
];

interface FormDataType {
    name: string;
    code: string;
    description: string;
    category: string;
}

export default function RefactorTabbed() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Category>("Category A");
    const [editingRow, setEditingRow] = useState<TestData | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<Category>("Category A");
    const [formData, setFormData] = useState<FormDataType>({
        name: "",
        code: "",
        description: "",
        category: "",
    });

    const tabListRef = useRef<HTMLDivElement>(null);

    // Hooks
    const { selectedRows, toggleRow, toggleSelectAll, clearSelection, setSelectedRows } = useRowSelection();
    const filteredData = initialDummyData.filter((item) => item.category === activeTab);
    const { currentPage, setCurrentPage, paginatedData } = usePagination(filteredData, 10);
    const {
        isAddDialogOpen,
        setIsAddDialogOpen,
        isEditDialogOpen,
        setIsEditDialogOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
    } = useAdminDialogs();

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
            category: "",
        });
    };

    const handleAddOpen = () => {
        resetForm();
        setActiveModalTab(activeTab);
        setIsAddDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name.trim() || !formData.code.trim()) {
            toast({
                title: "Validation Error",
                description: "Name and Code are required.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Record Added",
            description: "The record has been successfully added.",
        });
        setIsAddDialogOpen(false);
        resetForm();
    };

    const handleEdit = () => {
        const selectedIndex = Array.from(selectedRows)[0];
        const itemToEdit = paginatedData[selectedIndex];
        if (itemToEdit) {
            setEditingRow(itemToEdit);
            setFormData({
                name: itemToEdit.name,
                code: itemToEdit.code,
                description: itemToEdit.description,
                category: itemToEdit.category,
            });
            setActiveModalTab(itemToEdit.category);
            setIsEditDialogOpen(true);
        }
    };

    const handleSaveEdit = () => {
        if (!formData.name.trim() || !formData.code.trim()) {
            toast({
                title: "Validation Error",
                description: "Name and Code are required.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Record Updated",
            description: "The record has been successfully updated.",
        });
        setIsEditDialogOpen(false);
        setEditingRow(null);
        resetForm();
        setSelectedRows(new Set());
    };

    const confirmDelete = () => {
        toast({
            title: "Record Deleted",
            description: `${selectedRows.size} record(s) have been successfully deleted.`,
            variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setSelectedRows(new Set());
    };

    return (
        <div className="w-full h-full flex flex-col items-center px-6 bg-background">
            <div className="w-full max-w-[1400px] h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/50" />
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

                            {/* Modal Tabs */}
                            <div
                                className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden px-6 pb-2 flex-shrink-0"
                                role="tablist"
                                aria-label="Category filter"
                                ref={tabListRef}
                            >
                                {categories.map((category) => (
                                    <ModalTabButton
                                        key={category}
                                        label={category}
                                        isActive={activeModalTab === category}
                                        onClick={() => setActiveModalTab(category)}
                                    />
                                ))}
                            </div>

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
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="add-code" className="text-foreground text-base">
                                            Code
                                        </Label>
                                        <Input
                                            id="add-code"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value })
                                            }
                                            placeholder="Enter code"
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="add-description" className="text-foreground text-base">
                                            Description (Optional)
                                        </Label>
                                        <Input
                                            id="add-description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            placeholder="Enter description"
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

                            {/* Modal Tabs */}
                            <div
                                className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden px-6 pb-2 flex-shrink-0"
                                role="tablist"
                                aria-label="Category filter"
                                ref={tabListRef}
                            >
                                {categories.map((category) => (
                                    <ModalTabButton
                                        key={category}
                                        label={category}
                                        isActive={activeModalTab === category}
                                        onClick={() => setActiveModalTab(category)}
                                    />
                                ))}
                            </div>

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
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="edit-code" className="text-foreground text-base">
                                            Code
                                        </Label>
                                        <Input
                                            id="edit-code"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value })
                                            }
                                            placeholder="Enter code"
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="edit-description" className="text-foreground text-base">
                                            Description (Optional)
                                        </Label>
                                        <Input
                                            id="edit-description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            placeholder="Enter description"
                                            className="h-12 border-2 border-muted/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-0 rounded-lg text-base"
                                        />
                                    </div>

                                    <div className="flex justify-center gap-4 pt-6">
                                        <Button
                                            onClick={() => {
                                                setIsEditDialogOpen(false);
                                                setEditingRow(null);
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
                </div>

                {/* White Container with Tabs and Table */}
                <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col h-full overflow-hidden">
                    {/* Table Tabs */}
                    <div
                        className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden tabs-scrollbar flex-shrink-0 px-1 pb-2"
                        role="tablist"
                        aria-label="Category filter"
                    >
                        {categories.map((category) => {
                            const isActive = activeTab === category;
                            return (
                                <button
                                    key={category}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`panel-${category}`}
                                    onClick={() => {
                                        setActiveTab(category);
                                        setSelectedRows(new Set());
                                    }}
                                    className={`
                      px-4 py-3 text-sm font-semibold whitespace-nowrap
                      rounded-t-2xl relative transition-all duration-300
                      ${isActive
                            ? "bg-primary text-primary-foreground shadow-lg -mb-[1px] z-10 scale-105"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:scale-[1.02] hover:-translate-y-0.5"
                        }
                      before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px]
                      ${isActive ? "before:bg-primary" : "before:bg-transparent"}
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    `}
                                    style={{
                                        boxShadow: isActive
                                            ? "0 -4px 12px -2px rgba(255, 87, 34, 0.2), 0 -2px 4px -1px rgba(255, 87, 34, 0.1)"
                                            : "0 1px 3px rgba(0, 0, 0, 0.05)"
                                    }}
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>

                    {/* Table Container */}
                    <div
                        id={`panel-${activeTab}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${activeTab}`}
                        className="border border-border rounded-lg overflow-hidden relative flex-1 flex flex-col"
                    >
                        <div className="overflow-x-auto flex-shrink-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-background hover:bg-background border-b border-border">
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={filteredData.length > 0 && selectedRows.size === paginatedData.length}
                                                onCheckedChange={() => toggleSelectAll(paginatedData.length)}
                                                aria-label="Select all rows"
                                            />
                                        </TableHead>
                                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                                        <TableHead className="font-semibold text-foreground">Code</TableHead>
                                        <TableHead className="font-semibold text-foreground">Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                                No records found for {activeTab}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((row, index) => {
                                            const isSelected = selectedRows.has(index);
                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    className={`hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""
                                                        }`}
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleRow(index)}
                                                            aria-label={`Select ${row.name}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{row.name}</TableCell>
                                                    <TableCell>{row.code}</TableCell>
                                                    <TableCell>{row.description}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

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
                                totalItems={filteredData.length}
                                itemsPerPage={10}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
