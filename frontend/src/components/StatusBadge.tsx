type Status = string;

const statusConfig: Record<string, { label: string; classes: string }> = {
  // Booking statuses
  pending:    { label: 'Pending',    classes: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  confirmed:  { label: 'Confirmed',  classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  active:     { label: 'Active',     classes: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  completed:  { label: 'Completed',  classes: 'bg-carbon-600/50 text-carbon-400 border border-carbon-600' },
  cancelled:  { label: 'Cancelled',  classes: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  // Vehicle statuses
  available:   { label: 'Available',   classes: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  booked:      { label: 'Booked',      classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  maintenance: { label: 'Maintenance', classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || { label: status, classes: 'bg-carbon-700 text-carbon-400 border border-carbon-600' };
  return (
    <span className={`badge ${config.classes}`}>
      {config.label}
    </span>
  );
}
