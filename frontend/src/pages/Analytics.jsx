import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import api from '../api';

const COLORS = ['#2980b9', '#e67e22', '#8e44ad', '#27ae60', '#c0392b', '#f1c40f'];

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/analytics/summary')
      .then(({ data }) => setSummary(data))
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  if (error) return <div className="page">{error}</div>;
  if (!summary) return <div className="page">Loading analytics...</div>;

  const categoryData = Object.entries(summary.byCategory).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(summary.byStatus).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(summary.byPriority).map(([name, value]) => ({ name, value }));

  return (
    <div className="page">
      <h1>Analytics</h1>
      <p>
        {summary.totalIncidents} incidents between{' '}
        {new Date(summary.range.from).toLocaleDateString()} and{' '}
        {new Date(summary.range.to).toLocaleDateString()}
      </p>

      <div className="chart-grid">
        <div className="chart-card">
          <h2>Incidents by category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2980b9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Incidents by status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Incidents by priority</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#c0392b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Monthly trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={summary.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#27ae60" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2>Hotspot locations</h2>
      <table className="incident-table">
        <thead>
          <tr>
            <th>Building</th>
            <th>Incident count</th>
            <th>Avg risk score</th>
          </tr>
        </thead>
        <tbody>
          {summary.hotspots.map((h) => (
            <tr key={h.building}>
              <td>{h.building}</td>
              <td>{h.count}</td>
              <td>{h.avgRiskScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
