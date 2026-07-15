import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isSecurity, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Campus Incident Platform</div>
      <div className="navbar-links">
        <NavLink to="/report" className="nav-link">
          Report Incident
        </NavLink>
        <NavLink to="/dashboard" className="nav-link">
          Dashboard
        </NavLink>
        {isSecurity && (
          <NavLink to="/analytics" className="nav-link">
            Analytics
          </NavLink>
        )}
      </div>
      <div className="navbar-user">
        <span>{user.name || user.email}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
