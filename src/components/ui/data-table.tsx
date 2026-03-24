"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Plus } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  onQuickCreate?: () => void
  quickCreateLabel?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  onQuickCreate,
  quickCreateLabel
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            <>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer group hover:bg-bg-subtle" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {onQuickCreate && (
                <TableRow
                  onClick={onQuickCreate}
                  className="cursor-pointer group hover:bg-bg-subtle"
                >
                  <TableCell colSpan={columns.length} className="py-3">
                    <div className="flex items-center gap-2 text-fg-muted group-hover:text-fg transition-colors">
                      <Plus className="h-4 w-4" />
                      <span className="text-[13px] font-medium">{quickCreateLabel || "Create New"}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ) : (
            <>
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-fg-muted text-[13px]">
                  No results.
                </TableCell>
              </TableRow>
              {onQuickCreate && (
                <TableRow
                  onClick={onQuickCreate}
                  className="cursor-pointer group hover:bg-bg-subtle"
                >
                  <TableCell colSpan={columns.length} className="py-3">
                    <div className="flex items-center gap-2 text-fg-muted group-hover:text-fg transition-colors">
                      <Plus className="h-4 w-4" />
                      <span className="text-[13px] font-medium">{quickCreateLabel || "Create New"}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
