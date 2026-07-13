/**
 * Reusable FormSelect component
 * Simple Select for <5 options, Combobox for 5+ options
 * Includes AutoFillField for read-only dependent fields
 */

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  /** Label for the select field */
  label: string;
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Available options */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message (if any) */
  error?: string;
  /** Whether to always show search (true for 5+, optional for <5) */
  searchable?: boolean;
  /** Required field indicator */
  required?: boolean;
}

/**
 * FormSelect component - Smart dropdown with auto-search for 5+ options
 *
 * Usage:
 * <FormSelect
 *   label="Faculty"
 *   value={formData.faculty}
 *   onChange={(v) => setFormData({...formData, faculty: v})}
 *   options={[
 *     { label: "Engineering", value: "eng" },
 *     { label: "Science", value: "sci" },
 *   ]}
 * />
 */
export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  error,
  searchable,
  required = false,
}: FormSelectProps) {
  const isSearchable =
    searchable !== undefined ? searchable : options.length >= 5;
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || value; // Show value if no matching option found

  // Use Combobox for searchable, Select for simple
  if (isSearchable) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`select-${label}`} className="text-foreground text-base">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <SearchableSelect
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`select-${label}`} className="text-foreground text-base">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger
            id={`select-${label}`}
            className="h-12 border-2 border-muted/40 focus-visible:border-primary/60 rounded-lg text-base pr-14 [&>svg]:hidden"
          >
            <SelectValue placeholder={placeholder}>
              {selectedLabel && selectedLabel !== placeholder ? selectedLabel : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card border border-border z-50">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="absolute right-0 top-0 h-12 w-12 bg-primary rounded-r-lg flex items-center justify-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

/**
 * Internal searchable select using Combobox
 */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || value; // Show value if no matching option found

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-12 border-2 border-muted/40 focus-visible:border-primary/60 rounded-lg text-base justify-between w-full",
            error && "border-destructive"
          )}
        >
          <span className="truncate">
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup>
            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.value}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === opt.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * AutoFillField component for read-only dependent fields
 * Displays values auto-filled from FK selections
 */
interface AutoFillFieldProps {
  label: string;
  value: string;
  source?: string; // e.g., "From Faculty selection"
  icon?: React.ReactNode;
}

export function AutoFillField({
  label,
  value,
  source = "Auto-filled",
  icon,
}: AutoFillFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground text-base flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {label}
        <span className="text-xs font-normal text-muted-foreground">
          ({source})
        </span>
      </Label>
      <div className="h-12 border-2 border-muted rounded-lg flex items-center px-4 bg-muted/50 text-foreground">
        {value || "unknown"}
      </div>
    </div>
  );
}
