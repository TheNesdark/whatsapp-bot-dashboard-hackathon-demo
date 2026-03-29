import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { FileText, Search, UserCheck, UserX, Check, X, ChevronLeft, ChevronRight, ArrowUpDown, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CAN_ACCEPT_STATUSES, CAN_REJECT_STATUSES, REGISTRATION_FILTER_OPTIONS, REGISTRATION_STATUS_LABELS } from '@/constants/registration';
import { cn } from '@/utils/cn';
import type { Registration, RegistrationTableProps } from '@/types';


function canAccept(status: string, blockedByOtherOperator: boolean, hasPhone: boolean): boolean {
  if (blockedByOtherOperator || !hasPhone) return false;
  return CAN_ACCEPT_STATUSES.has(status);
}

function canReject(status: string, blockedByOtherOperator: boolean, hasPhone: boolean): boolean {
  if (blockedByOtherOperator || !hasPhone) return false;
  return CAN_REJECT_STATUSES.has(status);
}

const columnHelper = createColumnHelper<Registration>();

export function RegistrationTable({
  registrations,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  areaFilter,
  onAreaFilterChange,
  areaList,
  onAccept,
  onReject,
  onApprove,
  onDeny,
  onAttend,
  onRelease,
  agentName,
  flowVariables,
}: RegistrationTableProps) {
  const dynamicColumns = useMemo(() => {
    if (!Array.isArray(flowVariables)) return [];
    return flowVariables.map((variable) =>
      columnHelper.accessor((row) => row.data?.[variable.id] || '', {
        id: variable.id,
        header: variable.label,
        cell: (info) => info.getValue() || <span className="td-dash">-</span>,
      }),
    );
  }, [flowVariables]);

  const columns = useMemo(() => [
    columnHelper.accessor('whatsapp_number', {
      header: 'WhatsApp',
      cell: (info) => {
        const reg = info.row.original;
        return (
          <div>
            <div className="td-mono">{info.getValue()}</div>
            <div className="td-sub">#{reg.id}</div>
          </div>
        );
      },
    }),
    ...dynamicColumns,
    columnHelper.accessor('created_at', {
      header: ({ column }) => (
        <button className="th-sort-btn" onClick={() => column.toggleSorting()}>
          Fecha/Hora
          <ArrowUpDown size={12} />
        </button>
      ),
      cell: info => {
        const date = info.getValue();
        return date ? format(new Date(date), 'dd MMM, HH:mm', { locale: es }) : <span className="td-dash">—</span>;
      },
    }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: info => {
        const status = info.getValue();
        const reg = info.row.original;
        const sc = REGISTRATION_STATUS_LABELS[status] || { label: status, cls: 'badge--pending' };
        return (
          <span className={cn('badge', sc.cls)}>
            <span className="badge-dot" />
            {sc.label}
            {status === 'attending' && reg.attended_by && (
              <span style={{ fontWeight: 400, opacity: 0.8 }}> · {reg.attended_by}</span>
            )}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => {
        const reg = info.row.original;
        const hasPhone = Boolean(reg.whatsapp_number);
        const isMyAttending = reg.status === 'attending' && reg.attended_by === agentName;
        const isOtherAttending = reg.status === 'attending' && !isMyAttending;

        const showAccept = canAccept(reg.status, isOtherAttending, hasPhone);
        const showReject = canReject(reg.status, isOtherAttending, hasPhone);

        // Dinamic branches from flow
        const branches = reg.approvalBranches || [];

        return (
          <div className="action-btns">
            {reg.status === 'pending' && (
              <button className="btn-icon btn-icon--attend" title="Tomar" onClick={() => onAttend(reg.id)}>
                <UserCheck size={14} />
              </button>
            )}

            {/* Custom branches from flow editor */}
            {Array.isArray(branches) && branches.map((branch) => (
              <button
                key={branch.id}
                className={cn(
                  'btn-icon',
                  branch.status === 'accepted' || branch.event === 'approved' ? 'btn-icon--accept' :
                    branch.status === 'rejected' || branch.event === 'rejected' ? 'btn-icon--reject' : 'btn-icon--attend'
                )}
                title={branch.label}
                onClick={() => {
                  if (branch.event === 'approved') {
                    onApprove(reg.id, reg.whatsapp_number, undefined, 'approved');
                  } else if (branch.event === 'rejected') {
                    onReject(reg.id, reg.whatsapp_number);
                  } else if (branch.event === 'needs_info') {
                    // Para corregir, abrimos el modal de aprobación pero con el evento específico
                    onApprove(reg.id, reg.whatsapp_number, undefined, 'needs_info');
                  } else {
                    onApprove(reg.id, reg.whatsapp_number, undefined, branch.event);
                  }
                }}
              >
                {branch.status === 'accepted' || branch.event === 'approved' ? (
                  <Check size={14} />
                ) : branch.status === 'rejected' || branch.event === 'rejected' ? (
                  <X size={14} />
                ) : (
                  <Hand size={14} />
                )}
              </button>
            ))}

            {/* Fallback to hardcoded buttons only if no branches are defined in flow */}
            {branches.length === 0 && (
              <>
                {showAccept && (
                  <button className="btn-icon btn-icon--accept" title="Aprobar" onClick={() => onApprove(reg.id, reg.whatsapp_number)}>
                    <Check size={14} />
                  </button>
                )}
                {showReject && (
                  <button className="btn-icon btn-icon--reject" title="Denegar" onClick={() => onDeny(reg.id, reg.whatsapp_number)}>
                    <X size={14} />
                  </button>
                )}
              </>
            )}

            {reg.status === 'attending' && isMyAttending && (
              <button className="btn-icon btn-icon--reject" title="Liberar" onClick={() => onRelease(reg.id)}>
                <UserX size={14} />
              </button>
            )}
          </div>
        );
      },
    }),
  ], [agentName, onAttend, onApprove, onDeny, onRelease, dynamicColumns]);

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <FileText size={15} className="card-title-icon" />
          Registros
          {registrations.length > 0 && <span className="count-badge">{registrations.length}</span>}
        </h2>
        <div className="filter-bar">
          <div className="search-wrapper">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todo estado</option>
            {REGISTRATION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={areaFilter}
            onChange={(e) => onAreaFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toda Área</option>
            {areaList.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="td-empty">
                  <div className="td-empty-inner">
                    <FileText size={28} className="td-empty-icon" />
                    <p className="td-empty-text">Sin registros</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {registrations.length > 10 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <div className="pagination-btns">
            <button
              className="btn-icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
