import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

const STATUS_OPTIONS = ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'];

export default function Dashboard() {
  const { isSecurity } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/incidents', { params });
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (incidentId, status) => {
    try {
      await api.patch(`/incidents/${incidentId}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Incident Dashboard</h1>
        {isSecurity && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading incidents...</p>
      ) : incidents.length === 0 ? (
        <p>No incidents found.</p>
      ) : (
        <table className="incident-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Building</th>
              <th>Reported</th>
              {isSecurity && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.incidentId}>
                <td>
                  <Link to={`/incidents/${incident.incidentId}`}>{incident.title}</Link>
                </td>
                <td>{incident.category}</td>
                <td>
                  <PriorityBadge priority={incident.priority} />
                </td>
                <td>
                  <StatusBadge status={incident.status} />
                </td>
                <td>{incident.location?.building}</td>
                <td>{new Date(incident.createdAt).toLocaleString()}</td>
                {isSecurity && (
                  <td>
                    <select
                      value={incident.status}
                      onChange={(e) => updateStatus(incident.incidentId, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
