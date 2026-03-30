import { useEffect, useState, useCallback } from 'react';
import { customerService } from '../services/api';
import type { Customer } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const emptyForm = {
  name: '', email: '', phone: '', cnic: '', address: '', driverLicense: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll({ search, page, limit });
      setCustomers(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, cnic: c.cnic, address: c.address || '', driverLicense: c.driverLicense || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await customerService.update(editing._id, form as any);
        toast.success('Customer updated');
      } else {
        await customerService.create(form as any);
        toast.success('Customer created');
      }
      setModalOpen(false);
      fetchCustomers();
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
      await customerService.delete(deleteTarget._id);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">CNIC</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-carbon-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-carbon-500">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-carbon-500">No customers found</td></tr>
              ) : customers.map(c => (
                <tr key={c._id} className="table-row-hover">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-xs font-bold">{c.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-carbon-500">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-carbon-400 font-mono text-xs">{c.phone}</td>
                  <td className="px-5 py-3.5 text-carbon-400 font-mono text-xs">{c.cnic}</td>
                  <td className="px-5 py-3.5 text-carbon-500 text-xs">{format(new Date(c.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
                      <button onClick={() => setDeleteTarget(c)} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-carbon-700 flex items-center justify-between">
            <span className="text-xs text-carbon-500">{total} customers total</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs font-mono text-carbon-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Ahmed Khan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="ahmed@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" placeholder="03xx-xxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">CNIC *</label>
            <input className="input" placeholder="xxxxx-xxxxxxx-x" value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} />
          </div>
          <div>
            <label className="label">Driver License</label>
            <input className="input" placeholder="License number" value={form.driverLicense} onChange={e => setForm(f => ({ ...f, driverLicense: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input className="input" placeholder="City, Province" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
