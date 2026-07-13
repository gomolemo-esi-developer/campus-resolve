/**
 * Reusable AdminTable component for master data management
 * Handles checkbox selection, row highlighting, pagination UI
 * Reduces ~200-250 lines of boilerplate per page
 */

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export interface AdminTableColumn<T> {
  /** Unique key corresponding to data property */
  key: keyof T;
  /** Column header label */
  label: string;
  /** Optional custom cell renderer */
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  /** Optional column width (Tailwind class like "min-w-24" or "w-full") */
  width?: string;
}

interface AdminTableProps<T> {
  /** Column configuration */
  columns: AdminTableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Set of selected row indices */
  selectedRows: Set<number>;
  /** Callback when checkbox toggled for specific row */
  onRowToggle: (index: number) => void;
  /** Callback when select-all checkbox toggled */
  onSelectAll: () => void;
  /** Optional loading state */
  loading?: boolean;
  /** Optional custom row className for styling */
  rowClassName?: (isSelected: boolean) => string;
}

/**
 * Reusable table component for admin pages
 *
 * Usage:
 * <AdminTable
 *   columns={[
 *     { key: 'id', label: 'ID' },
 *     { key: 'name', label: 'Name' },
 *     { key: 'faculty', label: 'Faculty', render: (val) => <Badge>{val}</Badge> }
 *   ]}
 *   data={campusData}
 *   selectedRows={selectedRows}
 *   onRowToggle={toggleRowSelection}
 *   onSelectAll={toggleSelectAll}
 * />
 */
export function AdminTable<T extends { [key: string]: any }>({
  columns,
  data,
  selectedRows,
  onRowToggle,
  onSelectAll,
  loading = false,
  rowClassName,
}: AdminTableProps<T>) {
  const allSelected =
    selectedRows.size === data.length && data.length > 0;

  const defaultRowClassName = (isSelected: boolean) =>
    `hover:bg-muted/50 transition-all duration-200 ease-in-out border-b border-border last:border-b-0 ${
      isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""
    }`;

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden relative flex flex-col">
      <div className="overflow-x-auto admin-table">
        <Table className="w-full min-w-full table-layout-fixed transition-opacity duration-300 ease-in-out">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="bg-background hover:bg-background border-b border-border">
              <TableHead className="w-12 shrink-0">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={`font-semibold text-foreground ${col.width || "min-w-[120px]"}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <svg className="h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No items found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const isSelected = selectedRows.has(index);
                const className = rowClassName
                  ? rowClassName(isSelected)
                  : defaultRowClassName(isSelected);

                return (
                  <TableRow key={index} className={className}>
                    <TableCell className="shrink-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onRowToggle(index)}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell 
                        key={String(col.key)} 
                        className="align-top"
                        style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                      >
                        {col.render
                          ? col.render(row[col.key], row, index)
                          : String(row[col.key] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
