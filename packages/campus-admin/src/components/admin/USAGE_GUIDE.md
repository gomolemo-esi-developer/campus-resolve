# Admin Components Usage Guide

Quick reference for using Phase 1 shared components.

---

## 1. AdminTable

Generic table component that handles checkboxes, selection, and row styling.

### Basic Usage

```tsx
import { AdminTable, AdminTableColumn } from "@/components/admin";

interface Item {
  id: string;
  name: string;
  status: string;
}

const columns: AdminTableColumn<Item>[] = [
  { key: "id", label: "ID", width: "w-32" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
];

const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

<AdminTable
  columns={columns}
  data={data}
  selectedRows={selectedRows}
  onRowToggle={(index) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) newSelection.delete(index);
    else newSelection.add(index);
    setSelectedRows(newSelection);
  }}
  onSelectAll={() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  }}
/>
```

### With Custom Rendering

```tsx
const columns: AdminTableColumn<Item>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  {
    key: "status",
    label: "Status",
    render: (value, row, index) => (
      <Badge variant={value === "active" ? "default" : "secondary"}>
        {value}
      </Badge>
    ),
  },
];
```

### Props

```tsx
interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[]; // Column config
  data: T[]; // Data rows
  selectedRows: Set<number>; // Selected row indices
  onRowToggle: (index: number) => void; // Toggle single row
  onSelectAll: () => void; // Toggle all rows
  loading?: boolean; // Show loading state
  rowClassName?: (isSelected: boolean) => string; // Custom row CSS
}
```

---

## 2. FormModal

Unified Add/Edit dialog component.

### Basic Add Dialog

```tsx
import { FormModal } from "@/components/admin";
import { Building2 } from "lucide-react";

const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: "", abbr: "" });

<FormModal
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="ADD NEW CAMPUS"
  icon={<Building2 className="h-6 w-6" />}
  onSave={() => {
    // Handle save
    console.log(formData);
    setIsOpen(false);
  }}
>
  <div className="space-y-6">
    <Input
      placeholder="Campus Name"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
    <Input
      placeholder="Abbreviation"
      value={formData.abbr}
      onChange={(e) => setFormData({ ...formData, abbr: e.target.value })}
    />
  </div>
</FormModal>
```

### Edit Dialog with Cancel

```tsx
<FormModal
  isOpen={isEditOpen}
  onOpenChange={setIsEditOpen}
  title="EDIT CAMPUS"
  icon={<Building2 className="h-6 w-6" />}
  onSave={handleSaveEdit}
  onCancel={() => {
    setEditingItem(null);
    setFormData({ name: "", abbr: "" });
  }}
  isEditing // Shows Cancel + Save
  submitDisabled={!formData.name || !formData.abbr}
>
  {/* Form fields */}
</FormModal>
```

### Props

```tsx
interface FormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string; // "ADD NEW CAMPUS"
  subtitle?: string; // Optional subtitle
  icon?: React.ReactNode; // Icon for header
  onSave: () => void | Promise<void>; // Save handler
  onCancel?: () => void; // Cancel handler
  isEditing?: boolean; // Shows Cancel + Save (vs. just Save)
  submitLoading?: boolean; // Show loading state
  submitDisabled?: boolean; // Disable Save button
  submitText?: string; // Default: "Save"
  children: React.ReactNode; // Form content
}
```

---

## 3. FormSelect

Smart dropdown: Select for <5 options, Combobox for 5+.

### Simple Select

```tsx
import { FormSelect } from "@/components/admin";

<FormSelect
  label="Campus"
  value={formData.campus}
  onChange={(v) => setFormData({ ...formData, campus: v })}
  options={[
    { label: "Soshanguve North", value: "SN" },
    { label: "Soshanguve South", value: "SS" },
    { label: "Arcadia", value: "ARC" },
  ]}
  placeholder="Select Campus"
/>
```

### Searchable Dropdown (5+ options)

Auto-enabled when 5+ options. Can force with `searchable={true}`.

```tsx
<FormSelect
  label="Faculty"
  value={formData.faculty}
  onChange={(v) => setFormData({ ...formData, faculty: v })}
  options={[
    { label: "Arts", value: "ART" },
    { label: "Engineering & Built Environment", value: "FEBE" },
    { label: "Finance", value: "FIN" },
    { label: "Humanities", value: "HUM" },
    { label: "Information Technology Communication", value: "ICT" },
    { label: "Management Science", value: "MMS" },
    { label: "Science", value: "SCI" },
  ]}
  required
/>
```

### With Error Handling

```tsx
<FormSelect
  label="Faculty"
  value={formData.faculty}
  onChange={(v) => setFormData({ ...formData, faculty: v })}
  options={facultyOptions}
  required
  error={formErrors.faculty} // "This field is required"
/>
```

### Props

```tsx
interface FormSelectProps {
  label: string; // "Faculty"
  value: string; // Current selected value
  onChange: (value: string) => void; // Change handler
  options: SelectOption[]; // [{ label: "...", value: "..." }]
  placeholder?: string; // Default: "Select..."
  disabled?: boolean; // Disable field
  error?: string; // Error message
  searchable?: boolean; // Force search mode
  required?: boolean; // Show required indicator
}
```

---

## 4. AutoFillField

Read-only field for displaying auto-filled FK values.

```tsx
import { AutoFillField } from "@/components/admin";
import { Globe } from "lucide-react";

<AutoFillField
  label="Faculty"
  value={selectedFacultyName}
  source="From Department selection"
  icon={<Globe className="h-5 w-5" />}
/>
```

### Props

```tsx
interface AutoFillFieldProps {
  label: string; // "Faculty"
  value: string; // Display value
  source?: string; // "From Department selection"
  icon?: React.ReactNode; // Optional icon
}
```

---

## 5. Pagination

Reusable pagination with record count.

### Basic

```tsx
import { Pagination } from "@/components/admin";

const [currentPage, setCurrentPage] = useState(1);

<Pagination
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  totalItems={100}
  itemsPerPage={10}
/>
```

### Show Record Count

```tsx
<Pagination
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  totalItems={data.length}
  itemsPerPage={10}
  showRecordCount
/>
```

### Props

```tsx
interface PaginationProps {
  currentPage: number; // 1-indexed
  onPageChange: (page: number) => void;
  totalItems?: number; // For calculating total pages
  itemsPerPage?: number; // Default: 10
  showRecordCount?: boolean; // Show "Showing X-Y of Z"
}
```

---

## 6. Constants

Centralized enums and validation rules.

### Available Constants

```tsx
import {
  TITLES, // ["Mr.", "Mrs.", "Ms.", ...]
  LEVELS, // ["1", "2", ...]
  RESIDENCE_TYPES, // ["On-Campus", "Off-Campus", ...]
  ACCESS_SCOPES, // ["Global", "Campus", ...]
  QUALIFICATION_TYPES, // { "HCert": "Higher Certificate", ... }
  QUALIFICATION_TYPES_LIST, // ["HCert", "Diploma", ...]
  ACTIVITY_CATEGORIES, // ["Sports", "Indigenous Activities", ...]
  VALIDATION, // { ABBREVIATION_MIN: 3, ABBREVIATION_MAX: 10, ... }
  ERROR_MESSAGES, // { FIELD_REQUIRED, ABBREVIATION_LENGTH, ... }
} from "@/components/admin";
```

### Usage in Dropdowns

```tsx
<FormSelect
  label="Title"
  value={formData.title}
  onChange={(v) => setFormData({ ...formData, title: v })}
  options={TITLES.map(t => ({ label: t, value: t }))}
/>
```

### Usage in Validation

```tsx
const validateForm = (data) => {
  const errors = {};
  if (data.abbr.length < VALIDATION.ABBREVIATION_MIN) {
    errors.abbr = ERROR_MESSAGES.ABBREVIATION_LENGTH;
  }
  return errors;
};
```

---

## Complete Example: Campus Page Pattern

```tsx
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AdminTable,
  AdminTableColumn,
  FormModal,
  Pagination,
  ERROR_MESSAGES,
  VALIDATION,
} from "@/components/admin";
import { Search, Plus, Building2, X, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CampusData {
  id: string;
  name: string;
  abbreviation: string;
}

export default function CampusExample() {
  const { toast } = useToast();
  const [data, setData] = useState<CampusData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CampusData | null>(null);
  const [formData, setFormData] = useState({ name: "", abbreviation: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (data: typeof formData) => {
    const errors: Record<string, string> = {};
    if (!data.name.trim()) errors.name = ERROR_MESSAGES.FIELD_REQUIRED;
    if (!data.abbreviation.trim()) errors.abbreviation = ERROR_MESSAGES.FIELD_REQUIRED;
    else if (
      data.abbreviation.length < VALIDATION.ABBREVIATION_MIN ||
      data.abbreviation.length > VALIDATION.ABBREVIATION_MAX
    )
      errors.abbreviation = ERROR_MESSAGES.ABBREVIATION_LENGTH;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm(formData)) return;
    setData([
      ...data,
      { id: Math.random().toString(), ...formData },
    ]);
    setIsAddOpen(false);
    setFormData({ name: "", abbreviation: "" });
    toast({ title: "Campus Added" });
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) newSelection.delete(index);
    else newSelection.add(index);
    setSelectedRows(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === data.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(data.map((_, i) => i)));
  };

  const columns: AdminTableColumn<CampusData>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "abbreviation", label: "Abbreviation" },
  ];

  const isFormValid = formData.name.trim() && formData.abbreviation.trim();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex gap-4">
        <Input placeholder="Search..." className="flex-1" />
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Campus
        </Button>
      </div>

      {/* Add Dialog */}
      <FormModal
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="ADD NEW CAMPUS"
        icon={<Building2 className="h-6 w-6" />}
        onSave={handleSave}
        submitDisabled={!isFormValid}
      >
        <div className="space-y-6">
          <div>
            <Label>Campus Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={formErrors.name ? "border-destructive" : ""}
            />
            {formErrors.name && <p className="text-destructive text-sm">{formErrors.name}</p>}
          </div>
          <div>
            <Label>Abbreviation</Label>
            <Input
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              className={formErrors.abbreviation ? "border-destructive" : ""}
            />
            {formErrors.abbreviation && (
              <p className="text-destructive text-sm">{formErrors.abbreviation}</p>
            )}
          </div>
        </div>
      </FormModal>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={data}
        selectedRows={selectedRows}
        onRowToggle={toggleRowSelection}
        onSelectAll={toggleSelectAll}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalItems={data.length}
        itemsPerPage={10}
      />
    </div>
  );
}
```

---

## Tips & Best Practices

1. **Always use FormSelect for dropdowns** - Automatic search for 5+ options
2. **Always validate before save** - Use ERROR_MESSAGES for consistency
3. **Disable Save button** - `submitDisabled={!isFormValid}`
4. **Use Badges for FK display** - Makes relationships clear in tables
5. **Group form fields** - Wrap in `<div className="space-y-6">` for consistency
6. **Auto-fill read-only fields** - Use AutoFillField component
7. **Consistent error handling** - Display errors below field in red
8. **Toast on success** - Provide user feedback on CRUD operations

---

**Last Updated:** February 22, 2025
