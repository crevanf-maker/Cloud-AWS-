const STATUS_COLORS = {
  reported: '#e67e22',
  acknowledged: '#2980b9',
  in_progress: '#8e44ad',
  resolved: '#27ae60',
  closed: '#7f8c8d',
};

const PRIORITY_COLORS = {
  Critical: '#c0392b',
  High: '#e67e22',
  Medium: '#f1c40f',
  Low: '#2ecc71',
};

export function StatusBadge({ status }) {
  return (
    <span className="badge" style={{ backgroundColor: STATUS_COLORS[status] || '#95a5a6' }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className="badge" style={{ backgroundColor: PRIORITY_COLORS[priority] || '#95a5a6' }}>
      {priority}
    </span>
  );
}
