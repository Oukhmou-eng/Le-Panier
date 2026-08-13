import "../../css/Boutiques.css";
import { useEffect, useMemo, useState } from "react";
import { getTokenPayload } from "../../store/authStore";

const API_BASE = "http://localhost:3000/categories";

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newStatus, setNewStatus] = useState("actif");
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous devez être connecté(e) pour accéder à cette page admin.");
      setLoading(false);
      return;
    }

    const payload = getTokenPayload(token);
    if (!payload?.role || payload.role !== "admin") {
      setError("Accès refusé : vous devez être administrateur pour voir cette page.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_BASE}/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      setCategories(data ?? []);
    } catch (requestError) {
      console.error("Erreur chargement catégories :", requestError);
      setError(requestError.message || "Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const displayedCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return categories
      .filter((category) => {
        if (statusFilter !== "all" && category.statut !== statusFilter) {
          return false;
        }
        if (!normalizedSearch) return true;
        return (
          category.nom?.toLowerCase().includes(normalizedSearch) ||
          category.icone?.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [categories, search, statusFilter]);

  const saveStatus = async (categoryId, categoryName, nextStatus, previousStatus) => {
    if (nextStatus === previousStatus) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous devez être connecté(e) pour modifier une catégorie.");
      return;
    }

    setSavingId(categoryId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nextStatus }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      setCategories((current) =>
        current.map((item) =>
          item.id_categorie === categoryId ? { ...item, statut: nextStatus } : item,
        ),
      );
      setMessage(`Statut de ${categoryName} mis à jour.`);
    } catch (requestError) {
      console.error("Erreur mise à jour catégorie :", requestError);
      setError(requestError.message || "Impossible de mettre à jour la catégorie.");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous devez être connecté(e) pour ajouter une catégorie.");
      return;
    }

    const payload = getTokenPayload(token);
    if (!payload?.role || payload.role !== "admin") {
      setError("Accès refusé : vous devez être administrateur pour ajouter une catégorie.");
      return;
    }

    if (!newName.trim()) {
      setError("Le nom de la catégorie est requis.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: newName.trim(), icone: newIcon.trim() || null, statut: newStatus }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      setCategories((current) => [{ ...data }, ...current]);
      setMessage(`Catégorie ${data.nom} ajoutée.`);
      setShowCreateForm(false);
      setNewName("");
      setNewIcon("");
      setNewStatus("actif");
    } catch (requestError) {
      console.error("Erreur création catégorie :", requestError);
      setError(requestError.message || "Impossible de créer la catégorie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="directory-shops-page">
      <section className="directory-shops" aria-labelledby="admin-categories-title">
        <header className="directory-shops__header">
          <span className="directory-shops__eyebrow">Administration</span>
          <h1 id="admin-categories-title">Gestion des catégories</h1>
          <p>Affichez les catégories avec icône, nom et statut, et ajoutez facilement une nouvelle catégorie.</p>
          <button className="btn teal btn-sm" type="button" onClick={() => setShowCreateForm(true)}>
            Ajouter une catégorie
          </button>
        </header>

        <div className="directory-shops__tools">
          <label className="directory-shops__search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Rechercher une catégorie"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="directory-shops__sort">
            <span>Filtrer par statut</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </label>
        </div>

        {message && <div className="directory-shops__notice">{message}</div>}
        {error && <div className="directory-shops__notice directory-shops__notice--error">{error}</div>}

        {!loading && !error && (
          <p className="directory-shops__count">
            {displayedCategories.length} catégorie{displayedCategories.length > 1 ? "s" : ""} affichée{displayedCategories.length > 1 ? "s" : ""}
          </p>
        )}
        {loading && <div className="directory-shops__notice">Chargement des catégories…</div>}

        {!loading && !error && displayedCategories.length === 0 && (
          <div className="directory-shops__empty">
            <span aria-hidden="true">⚠</span>
            <h2>Aucune catégorie trouvée</h2>
            <p>Essayez un autre filtre ou ajoutez une catégorie.</p>
          </div>
        )}

        {!loading && !error && displayedCategories.length > 0 && (
          <div className="directory-shops__list">
            {displayedCategories.map((category) => (
              <article className="directory-shop-card" key={category.id_categorie}>
                <div className="directory-shop-card__logo">
                  {category.icone ? <img src={category.icone} alt={category.nom} /> : category.nom.slice(0, 1).toUpperCase()}
                </div>
                <div className="directory-shop-card__content">
                  <h2>{category.nom}</h2>
                  <div className="directory-shop-card__details">
                    <span>Statut : {category.statut}</span>
                    <span>#{category.id_categorie}</span>
                  </div>
                </div>
                <div className="directory-shop-card__actions">
                  <select
                    value={category.statut}
                    onChange={(event) => saveStatus(category.id_categorie, category.nom, event.target.value, category.statut)}
                    disabled={savingId === category.id_categorie}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showCreateForm && (
        <div className="directory-shops__overlay">
          <div className="directory-shops__modal">
            <div className="directory-shops__modal-header">
              <div>
                <h2>Nouvelle catégorie</h2>
                <p>Renseignez le nom, l'icône et le statut.</p>
              </div>
              <button className="btn secondary btn-sm" type="button" onClick={() => setShowCreateForm(false)}>
                Fermer
              </button>
            </div>
            <form className="directory-shops__form" onSubmit={handleCreateCategory}>
              <label className="directory-shops__field">
                <span>Nom de la catégorie</span>
                <input
                  className="directory-shops__input"
                  name="nom"
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  required
                />
              </label>
              <label className="directory-shops__field">
                <span>Icône (URL ou nom de fichier)</span>
                <input
                  className="directory-shops__input"
                  name="icone"
                  type="text"
                  value={newIcon}
                  onChange={(event) => setNewIcon(event.target.value)}
                />
              </label>
              <label className="directory-shops__field">
                <span>Statut</span>
                <select
                  className="directory-shops__input"
                  name="statut"
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </label>
              <div className="directory-shops__actions--form">
                <button className="btn secondary btn-sm" type="button" onClick={() => setShowCreateForm(false)}>
                  Annuler
                </button>
                <button className="btn teal btn-sm" type="submit" disabled={submitting}>
                  {submitting ? 'Création…' : 'Ajouter la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
