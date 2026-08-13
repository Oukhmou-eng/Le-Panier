import '../css/AdminSidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';

function AdminSidebar() {
  const navigate = useNavigate();

  const deconnecter = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nom');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('id_boutique');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar admin-sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⚙️</span>
        <div className="brand-text">
          <span className="brand-title">Espace admin</span>
          <span className="brand-subtitle">Navigation rapide</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink end className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/dashboard">
          <span className="ic">📊</span>
          <span className="label">Tableau de bord</span>
        </NavLink>
        <NavLink className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/boutiques">
          <span className="ic">🏬</span>
          <span className="label">Boutiques</span>
        </NavLink>
        <NavLink className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/users">
          <span className="ic">👥</span>
          <span className="label">Utilisateurs</span>
        </NavLink>
        <NavLink className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/plans">
          <span className="ic">💳</span>
          <span className="label">Plans</span>
        </NavLink>
        <NavLink className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/categories">
          <span className="ic">🗂️</span>
          <span className="label">Catégories</span>
        </NavLink>
        <NavLink className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/factures">
          <span className="ic">🧾</span>
          <span className="label">Factures</span>
        </NavLink>
        <NavLink className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`} to="/admin/signalements">
          <span className="ic">🚨</span>
          <span className="label">Signalements</span>
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        <button type="button" className="btn-logout" onClick={deconnecter}>
          <span className="ic">⏻</span>
          <span className="label">Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
