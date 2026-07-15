import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['medical', 'fire', 'security', 'infrastructure', 'harassment', 'other'];

export default function ReportIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    severity: 3,
    building: '',
    lat: '',
    lng: '',
  });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const uploadPhoto = async () => {
    if (!photo) return null;
    const { data } = await api.post('/uploads/presign', {
      fileName: photo.name,
      contentType: photo.type,
    });
    await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': photo.type },
      body: photo,
    });
    return data.key;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const photoKey = await uploadPhoto();
      const { data } = await api.post('/incidents', {
        title: form.title,
        description: form.description,
        category: form.category,
        severity: Number(form.severity),
        location: {
          building: form.building,
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
        },
        photoKey,
      });
      setSuccess(data.incident);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Report an Incident</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={form.title} onChange={updateField('title')} required />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={updateField('description')} rows={4} required />
        </label>
        <div className="form-row">
          <label>
            Category
            <select value={form.category} onChange={updateField('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Severity (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={form.severity}
              onChange={updateField('severity')}
              required
            />
          </label>
        </div>
        <label>
          Building / Location name
          <input value={form.building} onChange={updateField('building')} required />
        </label>
        <div className="form-row">
          <label>
            Latitude (optional)
            <input value={form.lat} onChange={updateField('lat')} />
          </label>
          <label>
            Longitude (optional)
            <input value={form.lng} onChange={updateField('lng')} />
          </label>
        </div>
        <label>
          Evidence photo (optional)
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
        </label>
        {error && <p className="error-text">{error}</p>}
        {success && (
          <p className="success-text">
            Incident submitted with priority <strong>{success.priority}</strong> (risk score{' '}
            {success.riskScore}). Redirecting to dashboard...
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit incident'}
        </button>
      </form>
    </div>
  );
}
