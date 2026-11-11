import "../../css/Catalogue.css";
import "../../css/Favoris.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   Page Soldes — même structure/design que Catalogue,
   affiche uniquement les produits en promotion.
   ========================================================= */

function Soldes() {
  const navigate = useNavigate();

  /* ---------- Résultats soldes ---------- */
  const [produits, setProduits] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- État de chargement / erreur ---------- */
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [favoris, setFavoris] = useState(new Set());
  const [showFavDialog, setShowFavDialog] = useState(false);

  /* =========================================================
     Appel API
     ========================================================= */

  // TODO: confirmer la route réelle côté backend (ex: GET /soldes?page=...)
  // et le préfixe du contrôleur si différent de "soldes".
  const fetchSoldes = async () => {
  setIsLoading(true);
  setLoadError(false);
  try {
    const res = await fetch(
      `http://localhost:3000/categories/soldes?page=${currentPage}`
    );
    const data = await res.json();
    console.log(data);

      // Adapte les champs SQL au format attendu par la grille,
      // et calcule le pourcentage de réduction à afficher.
      const produitsAdaptes = (data?.produits ?? []).map((p) => {
        const prixOriginal = Number(p.prix_original ?? 0);
        const prixPromo = Number(p.prix_promo ?? prixOriginal);

        // TODO: confirmer les valeurs réelles possibles de type_reduction
        // (ex: 'pourcentage' vs 'montant') pour affiner ce calcul.
        let pourcentage = 0;
        if (p.type_reduction === "pourcentage") {
          pourcentage = Number(p.valeur_reduction ?? 0);
        } else if (prixOriginal > 0) {
          pourcentage = Math.round(
            ((prixOriginal - prixPromo) / prixOriginal) * 100
          );
        }

        return {
          id: p.id_produit,
          name: p.nom,
          shop: p.boutique_nom,
          priceOriginal: prixOriginal,
          pricePromo: prixPromo,
          discountPercent: pourcentage,
          mediaUrl: p.url,
          mediaType: p.type,
        };
      });

      setProduits(produitsAdaptes);
      setTotalCount(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch (error) {
      console.error("An error ", error);
      setLoadError(true);
      setProduits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavoris = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/favoris/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      setFavoris(new Set((data?.produitsVedette ?? []).map((produit) => produit.id_produit)));
    } catch (error) {
      console.error('Erreur lors du chargement des favoris :', error);
    }
  };

  useEffect(() => {
    fetchSoldes();
    loadFavoris();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /* =========================================================
     Navigation / pagination
     ========================================================= */

  // TODO: confirmer la route réelle de la fiche produit côté router.
  const handleProductClick = (productId) => {
    navigate(`/produit/${productId}`);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

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

  const goToPrevious = () => handlePageChange(currentPage - 1);
  const goToNext = () => handlePageChange(currentPage + 1);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  /* =========================================================
     Lecture vidéo au survol
     ========================================================= */

  const handleVideoEnter = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        // lecture bloquée par le navigateur (rare avec muted) — on ignore
      });
    }
  };

  const handleVideoLeave = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  /* =========================================================
     Rendu
     ========================================================= */

  return (
    <main className="main" id="visitorMain">
      <section className="view active" id="soldes">
        <div className="topline">
          <div>
            <span className="kicker">Soldes</span>
            <h1>Produits en promotion</h1>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
            {totalCount} produits en solde
          </span>
        </div>

        {/* États chargement / erreur / vide */}
        {isLoading && (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", color: "var(--ink-soft)" }}>
            Chargement…
          </div>
        )}

        {!isLoading && loadError && (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", color: "var(--danger)" }}>
            Une erreur est survenue lors du chargement des soldes.
          </div>
        )}

        {!isLoading && !loadError && produits.length === 0 && (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", color: "var(--ink-soft)" }}>
            Aucun produit en solde pour le moment.
          </div>
        )}

        {/* Grille produits en solde */}
        {!isLoading && !loadError && produits.length > 0 && (
          <div className="catalogue-grid">
            {produits.map((product) => {
              const estFavori = favoris.has(product.id);
              return (
              <div
                className="card"
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                onMouseEnter={handleVideoEnter}
                onMouseLeave={handleVideoLeave}
              >
                <div className="thumb">
                  {product.discountPercent > 0 && (
                    <span className="solde-badge">
                      -{product.discountPercent}%
                    </span>
                  )}

                  {product.mediaType === "video" && product.mediaUrl ? (
                    <video
                      src={product.mediaUrl}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : product.mediaUrl ? (
                    <img
                      src={product.mediaUrl}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}

                  {product.mediaType?.toLowerCase() === "video" && product.mediaUrl && (
                    <span className="play" aria-label="Ce produit contient une vidéo">▶</span>
                  )}
                </div>

                <div className="card-body">
                  <button
                    type="button"
                    className={`fav-btn ${estFavori ? "fav-active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavori(product.id);
                    }}
                    aria-label={estFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
                  />
                  <div className="name">{product.name}</div>
                  <div className="shop">{product.shop}</div>
                  <div className="solde-prices">
                    <span className="price-old">
                      {product.priceOriginal} MAD
                    </span>
                    <span className="price">{product.pricePromo} MAD</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
         <FavDialog
          isOpen={showFavDialog}
          onConfirm={() => {
            setShowFavDialog(false);
            navigate('/login');
          }}
          onCancel={() => setShowFavDialog(false)}
      />

        {/* Pagination */}
        <div className="pagination">
          <button className="nav" onClick={goToPrevious} disabled={isFirstPage}>
            ← Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={page === currentPage ? "active" : ""}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button className="nav" onClick={goToNext} disabled={isLastPage}>
            Suivant →
          </button>
        </div>
      </section>
    </main>
  );
}

export default Soldes;




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

