import "../css/PublicLayout.css";
import "../css/Dialogue.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom'

function PublicLayout() {
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [btnq, setBtnq] = useState(false);
  const [authDialogDestination, setAuthDialogDestination] = useState(null);

  const IconMenu = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );

  const IconSearch = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );

  const IconStore = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1-4h16l1 4" />
      <path d="M4 9h16v11H4z" />
      <path d="M8 9v-4" />
      <path d="M16 9v-4" />
    </svg>
  );

  const IconBell = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

  const IconShops = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 21h16" />
      <path d="M4 8h16" />
      <path d="M6 8V4h12v4" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
    </svg>
  );

  
  const [isConnected, setIsConnected] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [boutiques, setBoutiques] = useState([]);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setIsConnected(false);
      setNom("");
      setPrenom("");
      setAvatarUrl("");
      return;
    }

    setIsConnected(true);
    setNom(localStorage.getItem('nom') || "");
    setPrenom(localStorage.getItem('prenom') || "");
    setAvatarUrl(localStorage.getItem('avatar') || "");
    setShowUserDropdown(false);
  }, [location.pathname]);


  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setBoutiques([]);
      return;
    }

    const fetchMesBoutiques = async () => {
      try {
        const res = await fetch('http://localhost:3000/boutiques/mes-boutiques', {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const data = await res.json();
        setBoutiques(data?.boutiques ?? []);
      } catch (error) {
        console.error('Erreur lors du chargement de mes boutiques :', error);
        setBoutiques([]);
      }
    };
    fetchMesBoutiques();
  }, [location.pathname]);
  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || '?';

  useEffect(() => {
    if (!showUserDropdown) return undefined;

    const fermerMenuUtilisateur = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', fermerMenuUtilisateur);
    return () => document.removeEventListener('mousedown', fermerMenuUtilisateur);
  }, [showUserDropdown]);

  const deconnecter = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nom');
    localStorage.removeItem('prenom');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('id_boutique');
    sessionStorage.clear();
    setIsConnected(false);
    setShowUserDropdown(false)
    navigate('/home', { replace: true });
  };

  const handleClick = () => {
    if(btnq) {
    setBtnq(false);
  }
  else{
    setBtnq(true);
  } 
}


const handleShowList = () => {
    setShowList(!showList);
  };

  const normalizeCategories = (items) => {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => {
        if (typeof item === "string") return { id: item.trim(), label: item.trim() };
        if (item && typeof item === "object") {
          const label = item.nom || item.name || item.label || "";
          const id = item.id_categorie ?? item.id ?? item.slug ?? label;
          return label ? { id: String(id), label } : null;
        }
        return null;
      })
      .filter(Boolean);
  };

const handleCat = async () => {
    try {
      const res = await fetch('http://localhost:3000/categories');
      const data = await res.json();
      setCategories(normalizeCategories(data));
      console.log(data);
    } catch (error) {
      console.error('An error ', error);
    }
  }

useEffect(() => {  handleCat(); }, []);

  const goToCatalogue = useCallback((params = {}) => {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.category) query.set("category", String(params.category));
    setShowList(false);
    navigate(`/catalogue${query.toString() ? `?${query.toString()}` : ""}`);
  }, [navigate]);

  const handleSearchSubmit = () => goToCatalogue({ search });

  const navigateToProtectedPage = (destination) => {
    if (!localStorage.getItem("token")) {
      setAuthDialogDestination(destination);
      return;
    }
    navigate(destination);
  };

  useEffect(() => {
    const query = search.trim();
    if (!query) return undefined;

    const timer = setTimeout(() => goToCatalogue({ search: query }), 300);
    return () => clearTimeout(timer);
  }, [search, goToCatalogue]);


  return (
    <nav className="rail">
      <div className="rail-top">
        <button className="rail-brand" data-page="index.html">
          <span className="dot"></span>
          Le Panier
        </button>

        <div className="cats-dropdown-wrap">
          <button className="rail-cats-btn" onClick={handleShowList}>
            <span className="hamburger"><IconMenu /></span> Catégories
          </button>
          <div className={`cats-dropdown ${showList ? "open" : ""}`}>
            {normalizeCategories(categories).map((category) => (
              <button key={category.id} onClick={() => goToCatalogue({ category: category.id })}>
                {category.label}
              </button>
            ))}
          </div>
        </div> 

        <div className="rail-search">

         <input
        type="text"
        placeholder="Rechercher un produit, une boutique…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearchSubmit();
        }}
      />

      <button type="button" onClick={handleSearchSubmit} aria-label="Rechercher">
        <IconSearch />
      </button>



          
        </div>

        <div className="rail-right">
          {!isConnected ? (
            <button className="rail-link" data-page="connexion.html" id="railLoginBtn"
              onClick={() => {if (!btnq) {navigate('/login'); } else {  navigate('/registre'); };handleClick();} }>
                {btnq ? 'Sign In' : 'Sign Up'}
            </button>
          ) : (
            <>
              {boutiques.length > 0 && (
                <button
                  className="rail-icon-btn"
                  title="Ma boutique"
                  onClick={() =>{  localStorage.setItem(
            "id_boutique",
            boutiques[0].id_boutique
          );  ; navigate('/vendeur')}}
                >
                  <IconStore />
                </button>
              )}
              <button
                className="rail-icon-btn"
                title="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <IconBell />
              </button>
              <div className="header-user-wrap" id="headerUserMenu" ref={userMenuRef}>
                <button
                  type="button"
                  className="header-user-btn"
                  id="headerUserBtn"
                  onClick={() => setShowUserDropdown((isOpen) => !isOpen)}
                  aria-expanded={showUserDropdown}
                  aria-controls="headerUserDropdown"
                  aria-label={`Menu du compte de ${prenom} ${nom}`.trim() || 'Menu du compte'}
                >
                  <span className="hu-ava">
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : initiales}
                  </span>
                  <span className="hu-name" aria-hidden="true">{initiales}</span>
                </button>

                <div className={`header-user-dropdown ${showUserDropdown ? "open" : ""}`} id="headerUserDropdown">
                  <button
                    onClick={() => { setShowUserDropdown(false);navigate('/parametres');}}
                  >
                    <IconUser /> Mon profil 
                  </button>
                  <button
                    onClick={() => { setShowUserDropdown(false);navigate('/mes-commandes');}}
                  >
                   <IconOrders /> Suivi des commandes
                  </button>

                  <button
                    onClick={() => { setShowUserDropdown(false); navigate('/mes-commandes'); }}
                  >
                    <IconOrders /> Mes commandes
                  </button>
                  <button
                    onClick={() => { setShowUserDropdown(false); navigate('/messages'); }}
                  >
                    <IconMessages /> Messages
                  </button>
                  <button
                    onClick={() => { setShowUserDropdown(false); navigate('/boutiques-suivies'); }}
                  >
                    <IconShops /> Boutiques suivies
                  </button>




                  {boutiques.length == 0 && (
                <button
                  className="rail-icon-btn"
                  title="Ma boutique"
                  onClick={() =>{setShowUserDropdown(false) ;navigate('/creer-boutique')}}
                >
                  <IconStore /> Créer ma boutique
                </button>
              )}    
              

                

                  <button id="headerLogoutBtn" className="hu-danger" onClick={deconnecter}>
                    ⏻ Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            className="rail-icon-btn"
            title="Favoris"
            data-page="compte/favoris.html"
            onClick={() => navigateToProtectedPage("/favoris")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61c-1.54-1.34-3.88-1.35-5.44-.04L12 5.63l-3.4-3.06c-1.56-1.31-3.9-1.3-5.44.04-1.7 1.48-1.8 4.11-.23 5.7l8.04 8.21c.37.38.86.59 1.38.59.52 0 1.01-.21 1.38-.59l8.04-8.21c1.57-1.59 1.47-4.22-.23-5.7z" />
            </svg>
          </button>

          <button
            className="rail-icon-btn"
            data-page="panier.html"
            title="Panier"
            onClick={() => navigateToProtectedPage("/panier")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="rail-cats">
        <div className="rail-cats-list">
          <button onClick={() => {navigate('/home');} }>Accueil</button>
           <button onClick={() => {navigate('/soldes');} } >Soldes</button>
          <button onClick={() => {navigate('/catalogue');} } >Catalogue</button>
          <button onClick={() => {navigate('/boutiques');} }>Boutique</button>
          <button data-page="support.html">Aide</button>
        </div>
      </div>
      {authDialogDestination && (
        <div className="dialog-overlay" onClick={() => setAuthDialogDestination(null)}>
          <div className="dialog-box" onClick={(event) => event.stopPropagation()}>
            <h3>Connexion requise</h3>
            <p>Vous devez être connecté pour accéder à cette section. Voulez-vous vous connecter ?</p>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={() => setAuthDialogDestination(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setAuthDialogDestination(null);
                  navigate("/login");
                }}
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default PublicLayout;
