import '../css/VendeurSidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const IconStore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9h16" />
    <path d="M4 9l2-4h12l2 4" />
    <path d="M4 9v11h16V9" />
  </svg>
);

const IconAdd = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconShops = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 21h16" />
    <path d="M4 8h16" />
    <path d="M6 8V4h12v4" />
    <path d="M9 12h.01" />
    <path d="M15 12h.01" />
  </svg>
);

const IconOrders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M3 10h18" />
    <path d="M6 6v12" />
    <path d="M12 6v12" />
    <path d="M18 6v12" />
  </svg>
);

const IconMessages = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19h16" />
    <path d="M7 15l3-4 4 5 5-7" />
  </svg>
);

const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 4.6 1.65 1.65 0 0 0 10.5 4H11a2 2 0 0 1 4 0h.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8.6 1.65 1.65 0 0 0 21 10.5V11a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

function VendeurSidebar() {
  const navigate = useNavigate();
  const [boutique, setBoutique] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const id_b =  localStorage.getItem('id_boutique');

  useEffect(() => {
    setNomUtilisateur(localStorage.getItem('nom') || '');
  }, []);

  useEffect(() => {
    const fetchBoutiqueActive = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/boutiques/mes-boutiques/${id_b}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const data = await res.json();
        const premiereBoutique = data?.boutiques?.[0] ?? null;
        setBoutique(premiereBoutique);
      } catch (error) {
        console.error('Erreur lors du chargement de la boutique :', error);
        setBoutique(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBoutiqueActive();
  },[id_b]);








  const retourVersAcheteur = () => {
    navigate('/espConnecter');
  };

  const deconnecter = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nom');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem("id_boutique");
    sessionStorage.clear();
    navigate('/home', { replace: true });
  };

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-toggle">
        <button type="button" onClick={() => setIsCollapsed((value) => !value)} aria-label={isCollapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}>
          <span className={`chevron ${isCollapsed ? 'collapsed' : ''}`}>
            {isCollapsed ? '›' : '‹'}
          </span>
        </button>
      </div>

      <div className="mode-switch vendeur" id="modeSwitch">
        <button type="button" onClick={retourVersAcheteur}>
          <span className="arrow">←</span>
          <span className="label">Retour au compte</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/dashboard-vendeur"
        >
          <span className="ic"><IconStore /></span>
          <span className="label">Dashboard</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/publierProduit"
        >
          <span className="ic"><IconAdd /></span>
          <span className="label">Publier un produit</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/mes-produits"
        >
          <span className="ic"><IconShops /></span>
          <span className="label">Mes produits</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/publicites"
        >
          <span className="ic"><IconOrders /></span>
          <span className="label">Publicités</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/commandes-recues"
        >
          <span className="ic"><IconOrders /></span>
          <span className="label">Commandes reçues</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/statistiques"
        >
          <span className="ic"><IconChart /></span>
          <span className="label">Statistiques</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/avis-clients"
        >
          <span className="ic"><IconStar /></span>
          <span className="label">Avis clients</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/messages-vendeur"
        >
          <span className="ic"><IconMessages /></span>
          <span className="label">Messages</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `snav-item ${isActive ? 'active' : ''}`}
          to="/parametres-vendeur"
        >
          <span className="ic"><IconSettings /></span>
          <span className="label">Paramètres</span>
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-sep"></div>
        <button type="button" className="btn-logout" onClick={deconnecter}>
          <span className="ic">⏻</span>
          <span className="label">Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}

export default VendeurSidebar;