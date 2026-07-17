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
  /** Prevents cell content from wrapping (use for IDs, codes, short fixed values) */
  nowrap?: boolean;
  /** Truncates overflowing text with an ellipsis and a native tooltip, instead of wrapping */
  truncate?: boolean;
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
    `group border-b border-border/60 last:border-b-0 transition-colors duration-150 ease-in-out hover:bg-muted/40 ${
      isSelected ? "bg-primary/5 hover:bg-primary/[0.07]" : ""
    }`;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
      <div className="admin-table overflow-x-auto">
        <Table className="w-full table-fixed text-sm">
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <TableRow className="border-b border-border/70 bg-transparent hover:bg-transparent">
              <TableHead className="h-11 w-12 shrink-0 px-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={`h-11 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80 ${col.width || ""}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + 1} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + 1} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                      <svg className="h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No items found</p>
                      <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or search</p>
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
                    <TableCell className="shrink-0 px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onRowToggle(index)}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </TableCell>
                    {columns.map((col) => {
                      const cellContentClass = col.nowrap
                        ? "whitespace-nowrap"
                        : col.truncate
                          ? "truncate"
                          : "";
                      const rawValue = row[col.key];
                      return (
                        <TableCell
                          key={String(col.key)}
                          className={`px-4 py-3 align-middle text-foreground ${col.width || ""}`}
                        >
                          <div
                            className={cellContentClass}
                            title={!col.render && col.truncate ? String(rawValue ?? "") : undefined}
                          >
                            {col.render ? col.render(rawValue, row, index) : String(rawValue ?? "")}
                          </div>
                        </TableCell>
                      );
                    })}
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
