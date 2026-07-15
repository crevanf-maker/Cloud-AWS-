import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/incidents/${id}`)
      .then(({ data }) => setIncident(data.incident))
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, [id]);

  if (error) return <div className="page">{error}</div>;
  if (!incident) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <Link to="/dashboard">&larr; Back to dashboard</Link>
      <h1>{incident.title}</h1>
      <div className="badge-row">
        <PriorityBadge priority={incident.priority} />
        <StatusBadge status={incident.status} />
        <span>Risk score: {incident.riskScore}</span>
      </div>
      <p>{incident.description}</p>
      <dl className="detail-grid">
        <dt>Category</dt>
        <dd>{incident.category}</dd>
        <dt>Building</dt>
        <dd>{incident.location?.building}</dd>
        <dt>Reported by</dt>
        <dd>{incident.reportedByName}</dd>
        <dt>Created</dt>
        <dd>{new Date(incident.createdAt).toLocaleString()}</dd>
        <dt>Last updated</dt>
        <dd>{new Date(incident.updatedAt).toLocaleString()}</dd>
      </dl>
      <h2>Status history</h2>
      <ul className="status-history">
        {(incident.statusHistory || []).map((entry, idx) => (
          <li key={idx}>
            <StatusBadge status={entry.status} /> by {entry.by} at{' '}
            {new Date(entry.at).toLocaleString()}
            {entry.note && <div className="note">{entry.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
