import "../../css/Catalogue.css";
import "../../css/Favoris.css";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../css/Dialogue.css";

/* =========================================================
   Données statiques (celles qui ne viennent pas du backend)
   ========================================================= */

const PRICE_RANGES = [
  { id: "0-200", label: "0 – 200 MAD" },
  { id: "200-500", label: "200 – 500 MAD" },
  { id: "500+", label: "500 MAD +" },
];

const CONDITIONS = [
  { id: "neuf", label: "Neuf" },
  { id: "comme-neuf", label: "Comme neuf" },
  { id: "occasion", label: "Occasion" },
];

const SORT_OPTIONS = [
  { id: "pertinence", label: "Trier par : Pertinence" },
  { id: "prix-asc", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
  { id: "nouveautes", label: "Nouveautés" },
];

const INITIAL_CATEGORY_COUNT = 6;

/**
 * Adapte la forme des données reçues de /categories au format
 * attendu par le composant ({ id, label }).
 * Tolérant à plusieurs formes possibles en attendant de connaître
 * la vraie forme de la réponse backend.
 */
function normalizeCategories(data) {
  const list = Array.isArray(data) ? data : data?.categories ?? [];
  return list.map((cat) => ({
    id: String(cat.id_categorie ?? cat.id ?? cat._id ?? cat.slug ?? cat),
    label: cat.nom ?? cat.label ?? cat.name ?? String(cat),
  }));
}

function Catalogue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFavDialog, setShowFavDialog] = useState(false);

  /* ---------- Recherche / filtres / tri / pagination ---------- */
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const category = searchParams.get("category");
    return category ? [category] : [];
  });
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [minRating, setMinRating] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortOption, setSortOption] = useState("pertinence");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Résultats catalogue ---------- */
  const [produits, setProduits] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------- État de chargement / erreur ---------- */
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [favoris, setFavoris] = useState(new Set());

  /* ---------- Catégories dynamiques (backend) ---------- */
  const [categories, setCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  /* =========================================================
     Appels API
     ========================================================= */

  // Endpoint réel : POST /categories/filtre (voir categoriesService.filtre)
  // TODO: si le contrôleur a un préfixe différent de "categories",
  // ajuster l'URL ci-dessous en conséquence.
  const fetchCatalogue = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("http://localhost:3000/categories/filtre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search,
          categories: selectedCategories,
          priceRanges: selectedPriceRanges,
          minRating,
          conditions: selectedConditions,
          sort: sortOption,
          page: currentPage,
        }),
      });
      const data = await res.json();
      // Adapte les champs SQL (id_produit, nom, prix, boutique_nom, url, type)
      // au format attendu par la grille (id, name, shop, price, mediaUrl, mediaType).
      const produitsAdaptes = (data?.produits ?? []).map((p) => ({
        id: p.id_produit,
        name: p.nom,
        shop: p.boutique_nom,
        price: Number(p.prix ?? 0),
        pricePromo: p.prix_promo === null || p.prix_promo === undefined ? null : Number(p.prix_promo),
        discountPercent: p.type_reduction === "pourcentage"
          ? Number(p.valeur_reduction ?? 0)
          : p.prix_promo !== null && p.prix_promo !== undefined && Number(p.prix) > 0
            ? Math.round(((Number(p.prix) - Number(p.prix_promo)) / Number(p.prix)) * 100)
            : 0,
        mediaUrl: p.url,
        mediaType: p.type,
      }));
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

  const handleCat = async () => {
    try {
      const res = await fetch("http://localhost:3000/categories");
      const data = await res.json();
      setCategories(normalizeCategories(data));
    } catch (error) {
      console.error("An error ", error);
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

  // Chargement des catégories une seule fois
  useEffect(() => {
    handleCat();
    loadFavoris();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    const category = searchParams.get("category");
    setSelectedCategories(category ? [category] : []);
  }, [searchParams]);

  // Un changement de filtre/tri doit repartir de la page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategories, selectedPriceRanges, minRating, selectedConditions, sortOption]);

  // Requête catalogue avec debounce, déclenchée par recherche, filtres, tri ou page
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalogue();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    selectedCategories,
    selectedPriceRanges,
    minRating,
    selectedConditions,
    sortOption,
    currentPage,
  ]);

  /* =========================================================
     Helpers filtres
     ========================================================= */

  const toggleInArray = (array, setArray, value) => {
    setArray(
      array.includes(value)
        ? array.filter((v) => v !== value)
        : [...array, value]
    );
  };

  const activeFilters = [
    ...selectedCategories.map((id) => ({
      type: "category",
      id,
      label: categories.find((c) => c.id === id)?.label ?? id,
    })),
    ...selectedPriceRanges.map((id) => ({
      type: "price",
      id,
      label: PRICE_RANGES.find((p) => p.id === id)?.label.replace(" – ", "–"),
    })),
    ...(minRating
      ? [{ type: "rating", id: "rating", label: "★ 4 et plus" }]
      : []),
    ...selectedConditions.map((id) => ({
      type: "condition",
      id,
      label: CONDITIONS.find((c) => c.id === id)?.label,
    })),
  ];

  // Changer un state suffit : le useEffect au-dessus relance fetchCatalogue automatiquement.
  const removeActiveFilter = (filter) => {
    if (filter.type === "category") {
      toggleInArray(selectedCategories, setSelectedCategories, filter.id);
    } else if (filter.type === "price") {
      toggleInArray(selectedPriceRanges, setSelectedPriceRanges, filter.id);
    } else if (filter.type === "rating") {
      setMinRating(false);
    } else if (filter.type === "condition") {
      toggleInArray(selectedConditions, setSelectedConditions, filter.id);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setMinRating(false);
    setSelectedConditions([]);
  };

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  // TODO: confirmer la route réelle de la fiche produit côté router
  // (ex: <Route path="/produit/:id" element={<Produit />} /> dans le fichier de routes).
  const handleProductClick = (productId) => {
    navigate(`/produit/${productId}`);
  };

  const handleVideoEnter = (event) => {
    const video = event.currentTarget.querySelector("video");
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  const handleVideoLeave = (event) => {
    const video = event.currentTarget.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
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
     Rendu
     ========================================================= */

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, INITIAL_CATEGORY_COUNT);
  const hasHiddenCategories = categories.length > INITIAL_CATEGORY_COUNT;

  return (
    <main className="main" id="visitorMain">
      <section className="view active" id="catalogue">
        <div className="topline">
          <div>
            <span className="kicker">Catalogue</span>
            <h1>Rechercher, filtrer et trier</h1>
          </div>
        </div>

        <div className="cata-layout">
          {/* ---------- Filtres ---------- */}
          <aside className="filters">
            <div className="searchbar">
              🔍{" "}
              <input
                placeholder="Rechercher un produit…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-block">
              <h3>Catégorie</h3>
              <div className="category-filter-list">
              {visibleCategories.map((cat) => (
                <label key={cat.id}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() =>
                      toggleInArray(
                        selectedCategories,
                        setSelectedCategories,
                        cat.id
                      )
                    }
                  />{" "}
                  {cat.label}
                </label>
              ))}
              </div>
              {hasHiddenCategories && (
                <button
                  type="button"
                  className="category-filter-toggle"
                  onClick={() => setShowAllCategories((current) => !current)}
                  aria-expanded={showAllCategories}
                >
                  {showAllCategories
                    ? "Réduire la liste"
                    : `Voir les ${categories.length - INITIAL_CATEGORY_COUNT} autres catégories`}
                </button>
              )}
            </div>

            <div className="filter-block">
              <h3>Prix</h3>
              {PRICE_RANGES.map((range) => (
                <label key={range.id}>
                  <input
                    type="checkbox"
                    checked={selectedPriceRanges.includes(range.id)}
                    onChange={() =>
                      toggleInArray(
                        selectedPriceRanges,
                        setSelectedPriceRanges,
                        range.id
                      )
                    }
                  />{" "}
                  {range.label}
                </label>
              ))}
            </div>

            <div className="filter-block">
              <h3>Note vendeur</h3>
              <label>
                <input
                  type="checkbox"
                  checked={minRating}
                  onChange={() => setMinRating(!minRating)}
                />{" "}
                ★ 4 et plus
              </label>
            </div>

            <div className="filter-block">
              <h3>État</h3>
              {CONDITIONS.map((cond) => (
                <label key={cond.id}>
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(cond.id)}
                    onChange={() =>
                      toggleInArray(
                        selectedConditions,
                        setSelectedConditions,
                        cond.id
                      )
                    }
                  />{" "}
                  {cond.label}
                </label>
              ))}
            </div>
          </aside>

          {/* ---------- Contenu principal ---------- */}
          <div style={{ flex: 1 }}>
            {/* Tags des filtres actifs */}
            <div className="active-filters">
              {activeFilters.map((filter) => (
                <span
                  className="filter-tag"
                  key={`${filter.type}-${filter.id}`}
                >
                  {filter.label}{" "}
                  <button
                    title="Retirer"
                    onClick={() => removeActiveFilter(filter)}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button className="filter-tag clear" onClick={clearAllFilters}>
                Tout effacer
              </button>
            </div>

            {/* Barre de tri */}
            <div className="sortbar">
              <span style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
                {totalCount} produits
              </span>
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* États chargement / erreur / vide — mêmes classes que le design existant */}
            {isLoading && (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", color: "var(--ink-soft)" }}>
                Chargement…
              </div>
            )}

            {!isLoading && loadError && (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", color: "var(--danger)" }}>
                Une erreur est survenue lors du chargement des produits.
              </div>
            )}

            {!isLoading && !loadError && produits.length === 0 && (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", color: "var(--ink-soft)" }}>
                Aucun produit trouvé.
              </div>
            )}

            {/* Grille produits */}
            {!isLoading && !loadError && produits.length > 0 && (
              <div className="catalogue-grid">
                {produits.map((product) => {
                  const estFavori = favoris.has(product.id);
                  const estEnSolde = product.pricePromo !== null && product.pricePromo < product.price;
                  const estVideo = product.mediaType?.toLowerCase() === "video";
                  return (
                  <div
                    className="card"
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    onMouseEnter={handleVideoEnter}
                    onMouseLeave={handleVideoLeave}
                  >
                    <div
                      className="thumb"
                      style={
                        product.mediaUrl && !estVideo
                          ? {
                              backgroundImage: `url(${product.mediaUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      {estEnSolde && product.discountPercent > 0 && (
                        <span className="solde-badge">-{product.discountPercent}%</span>
                      )}
                      {estVideo && product.mediaUrl ? (
                        <video
                          src={product.mediaUrl}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : null}
                      {estVideo && product.mediaUrl && (
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
                      {estEnSolde ? (
                        <div className="solde-prices">
                          <span className="price-old">{product.price} MAD</span>
                          <span className="price">{product.pricePromo} MAD</span>
                        </div>
                      ) : (
                        <div className="price">
                          {product.price != null ? `${product.price} MAD` : "—"}
                        </div>
                      )}
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
              <button
                className="nav"
                onClick={goToPrevious}
                disabled={isFirstPage}
              >
                ← Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={page === currentPage ? "active" : ""}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                className="nav"
                onClick={goToNext}
                disabled={isLastPage}
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Catalogue;



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
