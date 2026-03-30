import { useEffect, useState, useCallback } from 'react';
import { vehicleService } from '../services/api';
import type { Vehicle } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const emptyForm = {
  make: '', model: '', year: new Date().getFullYear(), licensePlate: '',
  type: 'Sedan', dailyRate: '', status: 'available', color: '', mileage: '', description: '',
};

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Other'];
const VEHICLE_STATUSES = ['available', 'booked', 'maintenance'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getAll({ search, status: statusFilter || undefined, page, limit });
      setVehicles(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      make: v.make, model: v.model, year: v.year, licensePlate: v.licensePlate,
      type: v.type, dailyRate: String(v.dailyRate), status: v.status,
      color: v.color || '', mileage: String(v.mileage || ''), description: v.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, dailyRate: Number(form.dailyRate), mileage: Number(form.mileage) || 0 };
      if (editing) {
        await vehicleService.update(editing._id, payload as any);
        toast.success('Vehicle updated');
      } else {
        await vehicleService.create(payload as any);
        toast.success('Vehicle added');
      }
      setModalOpen(false);
      fetchVehicles();
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
      await vehicleService.delete(deleteTarget._id);
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
      fetchVehicles();
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
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="input pl-9" placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Plate</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Daily Rate</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Added</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-carbon-500">No vehicles found</td></tr>
              ) : vehicles.map(v => (
                <tr key={v._id} className="table-row-hover">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-white">{v.make} {v.model}</p>
                    <p className="text-xs text-carbon-500">{v.year} {v.color ? `· ${v.color}` : ''}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-amber-400 bg-amber-500/5 w-0">
                    <span className="px-2 py-1 rounded border border-amber-500/20">{v.licensePlate}</span>
                  </td>
                  <td className="px-5 py-3.5 text-carbon-400 text-xs">{v.type}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{formatCurrency(v.dailyRate)}<span className="text-carbon-500 font-normal text-xs">/day</span></td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.status} /></td>
                  <td className="px-5 py-3.5 text-carbon-500 text-xs">{format(new Date(v.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(v)} className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
                      <button onClick={() => setDeleteTarget(v)} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-carbon-700 flex items-center justify-between">
            <span className="text-xs text-carbon-500">{total} vehicles total</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs font-mono text-carbon-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Make *</label>
            <input className="input" placeholder="Toyota" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
          </div>
          <div>
            <label className="label">Model *</label>
            <input className="input" placeholder="Corolla" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div>
            <label className="label">Year *</label>
            <input className="input" type="number" min="1990" max="2030" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">License Plate *</label>
            <input className="input" placeholder="LHR-1234" value={form.licensePlate} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Daily Rate (PKR) *</label>
            <input className="input" type="number" min="0" placeholder="5000" value={form.dailyRate} onChange={e => setForm(f => ({ ...f, dailyRate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Color</label>
            <input className="input" placeholder="White" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mileage (km)</label>
            <input className="input" type="number" min="0" placeholder="0" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Optional notes" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Delete "${deleteTarget?.make} ${deleteTarget?.model} (${deleteTarget?.licensePlate})"? This cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
