import { useEffect, useState, useCallback } from 'react';
import { bookingService, customerService, vehicleService } from '../services/api';
import type { Booking, Customer, Vehicle } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const BOOKING_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

const emptyForm = {
  customer: '', vehicle: '', startDate: '', endDate: '', status: 'pending', notes: '',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const limit = 10;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingService.getAll({ status: statusFilter || undefined, page, limit });
      setBookings(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const loadDropdownData = async () => {
    const [cRes, vRes] = await Promise.all([
      customerService.getAll({ limit: 100 }),
      vehicleService.getAll({ limit: 100 }),
    ]);
    setCustomers(cRes.data.data);
    setVehicles(vRes.data.data);
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(emptyForm);
    await loadDropdownData();
    setModalOpen(true);
  };

  const openEdit = async (b: Booking) => {
    setEditing(b);
    setForm({
      customer: b.customer._id,
      vehicle: b.vehicle._id,
      startDate: format(new Date(b.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(b.endDate), 'yyyy-MM-dd'),
      status: b.status,
      notes: b.notes || '',
    });
    await loadDropdownData();
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.customer || !form.vehicle || !form.startDate || !form.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await bookingService.update(editing._id, form as any);
        toast.success('Booking updated');
      } else {
        await bookingService.create(form as any);
        toast.success('Booking created');
      }
      setModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bookingService.delete(deleteTarget._id);
      toast.success('Booking deleted');
      setDeleteTarget(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {BOOKING_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Booking
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Period</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Days</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-carbon-500">No bookings found</td></tr>
              ) : bookings.map(b => (
                <tr key={b._id} className="table-row-hover">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-xs font-bold">{b.customer?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{b.customer?.name}</p>
                        <p className="text-xs text-carbon-500">{b.customer?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-white">{b.vehicle?.make} {b.vehicle?.model}</p>
                    <p className="text-xs font-mono text-carbon-500">{b.vehicle?.licensePlate}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-carbon-400">
                    <p>{format(new Date(b.startDate), 'MMM d, yyyy')}</p>
                    <p className="text-carbon-600">→ {format(new Date(b.endDate), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="font-mono text-white font-semibold">{b.totalDays}</span>
                    <span className="text-carbon-500 text-xs">d</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-white">{formatCurrency(b.totalAmount)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(b)} className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
                      <button onClick={() => setDeleteTarget(b)} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-carbon-700 flex items-center justify-between">
            <span className="text-xs text-carbon-500">{total} bookings total</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs font-mono text-carbon-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Booking' : 'New Booking'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Customer *</label>
            <select
              className="input"
              value={form.customer}
              onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
              disabled={!!editing}
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vehicle *</label>
            <select
              className="input"
              value={form.vehicle}
              onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
              disabled={!!editing}
            >
              <option value="">Select vehicle...</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id} disabled={v.status !== 'available' && v._id !== form.vehicle}>
                  {v.make} {v.model} ({v.licensePlate}) — {v.status === 'available' ? '✓ Available' : `✗ ${v.status}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start Date *</label>
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input
              className="input"
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {BOOKING_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          <div className={editing ? '' : 'col-span-2'}>
            <label className="label">Notes</label>
            <input
              className="input"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Preview */}
        {form.startDate && form.endDate && form.vehicle && (() => {
          const days = Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000);
          const vehicle = vehicles.find(v => v._id === form.vehicle);
          const amount = vehicle ? vehicle.dailyRate * Math.max(1, days) : 0;
          if (days <= 0 || !vehicle) return null;
          return (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-medium">
                Estimated: {Math.max(1, days)} days × {formatCurrency(vehicle.dailyRate)}/day = <span className="font-bold text-sm">{formatCurrency(amount)}</span>
              </p>
            </div>
          );
        })()}

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Update Booking' : 'Create Booking'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Booking"
        message={`Delete the booking for "${deleteTarget?.customer?.name}"? This will make the vehicle available again.`}
        isLoading={deleting}
      />
    </div>
  );
}
