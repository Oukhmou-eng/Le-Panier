import "../../css/Favoris.css";
import "../../css/Home.css";

import "../../css/Dialogue.css";
import { useState } from "react";
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'

function Home() {
const [info, setInfo] = useState([]);
const [favoris, setFavoris] = useState(new Set());
const navigate = useNavigate();
const [showFavDialog, setShowFavDialog] = useState(false);

 const normalizeProducts = (items) => {
  const products = Array.isArray(items)
    ? items
    : items?.produitsVedette ?? [];

  return products.map((item) => ({
    id: item.id_produit,
    nom: item.nom || "",
    prix: Number(item.prix ?? 0),
    prixPromo: item.prix_promo === null || item.prix_promo === undefined
      ? null
      : Number(item.prix_promo),
    reductionPourcentage: item.type_reduction === "pourcentage"
      ? Number(item.valeur_reduction ?? 0)
      : item.prix_promo !== null && item.prix_promo !== undefined && Number(item.prix) > 0
        ? Math.round(((Number(item.prix) - Number(item.prix_promo)) / Number(item.prix)) * 100)
        : 0,
    boutique: item.boutique_nom || "",
    url: item.url || "",
    type: (item.type || "").toLowerCase(),
  }));
};

const handleGetHomeData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/home', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setInfo(data?.produitsVedette ?? []);
      setFavoris(new Set(data?.favoris ?? []));
      console.log(data);
    } catch (error) {
      console.error('An error ', error);
    }
  }

useEffect(() => { handleGetHomeData();  }, []);



const toggleFavori = async (produitId) => {


  const token = localStorage.getItem("token");

if (!token) {
  setShowFavDialog(true); 
  return;
}
  
  const estFavori = favoris.has(produitId);

  setFavoris((prev) => {
    const next = new Set(prev);
    if (estFavori) next.delete(produitId);
    else next.add(produitId);
    return next;
  });

  try {
    const res = await fetch(`http://localhost:3000/favoris/${produitId}`, {
      method: estFavori ? "DELETE" : "POST",
      headers: {
    Authorization: `Bearer ${token}`,
  },
    });

    if (!res.ok) {
      throw new Error(`Erreur HTTP ${res.status}`);
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des favoris :", error);
    setFavoris((prev) => {
      const next = new Set(prev);
      if (estFavori) next.add(produitId);
      else next.delete(produitId);
      return next;
    });
  }
};

return (
 <main className="main" id="visitorMain">

<section className="view active" id="accueil">
      <div className="section-head">
        <h2>Produits en vedette test</h2>
        <a
  className="link-sub"
  onClick={() => navigate("/catalogue")}
>
  <label>Voir le catalogue →</label> 
</a>
        
      </div>
      <div className="active-filters" id="homeActiveFilters" style={{ display: "none" }}></div>
      <div className="grid" id="homeGrid">
  {normalizeProducts(info).map((produit) => {
    const estFavori = favoris.has(produit.id);
    const estEnSolde = produit.prixPromo !== null && produit.prixPromo < produit.prix;
    return (
    <div
      key={produit.id}
      className="card"
      data-page="produit.html"
      data-name={produit.nom}
      data-cat=""
      onClick={() => navigate(`/produit/${produit.id}`)}
      
    >
      <div className="thumb">
        {estEnSolde && produit.reductionPourcentage > 0 && (
          <span className="home-solde-badge">-{produit.reductionPourcentage}%</span>
        )}
        {produit.type?.startsWith("video") ? (
          <video
            src={produit.url}
            muted
            loop
            playsInline
            onMouseOver={(e) => e.target.play()}
            onMouseOut={(e) => {
              e.target.pause();
              e.target.currentTime = 0;
            }}
          />
        ) : (
          <img
            src={produit.url}
            alt={produit.nom}
          />
        )}

        {produit.type?.startsWith("video") && (
          <span className="play">▶</span>
        )}
      </div>

      <div className="card-body">
        <button
          type="button"
          className={`fav-btn ${estFavori ? "fav-active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavori(produit.id);
          }}
          aria-label={estFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
        />
        
        <div className="name">{produit.nom}</div>
        <div className="shop">{produit.boutique}</div>
        {estEnSolde ? (
          <div className="home-solde-prices">
            <span className="home-price-old">{produit.prix} MAD</span>
            <span className="price">{produit.prixPromo} MAD</span>
          </div>
        ) : (
          <div className="price">{produit.prix} MAD</div>
        )}
      </div>
    </div>
    );
  })}
</div>
 <FavDialog
          isOpen={showFavDialog}
          onConfirm={() => {
            setShowFavDialog(false);
            navigate('/login');
          }}
          onCancel={() => setShowFavDialog(false)}
      />
      
    </section>

   
  </main>
);


}

export default Home ;





const FavDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h3>Connexion requise</h3>
        <p>Vous devez être connecté pour ajouter ce produit au favoris . Voulez-vous vous connecter ?</p>
        <div className="dialog-actions">
          <button onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};




