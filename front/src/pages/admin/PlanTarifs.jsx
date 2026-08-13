import "../../css/PlanTarifs.css";
import { useEffect, useMemo, useState } from "react";
import { getTokenPayload } from "../../store/authStore";

const API_BASE = "http://localhost:3000/promotions";

export default function PlanTarifsAdmin() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [activePlan, setActivePlan] = useState(null);
  const [nomPlan, setNomPlan] = useState("");
  const [typeCible, setTypeCible] = useState("produit");
  const [dureeJours, setDureeJours] = useState(1);
  const [prix, setPrix] = useState(0);
  const [priorite, setPriorite] = useState(0);
  const [statut, setStatut] = useState("actif");
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Vous devez être connecté(e) pour accéder à cette page.");
      const payload = getTokenPayload(token);
      if (!payload?.role || payload.role !== "admin") {
        throw new Error("Accès refusé : vous devez être administrateur.");
      }

      const response = await fetch(`${API_BASE}/admin/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      setPlans(data ?? []);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Impossible de charger les plans tarifaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const resetForm = () => {
    setActivePlan(null);
    setNomPlan("");
    setTypeCible("produit");
    setDureeJours(1);
    setPrix(0);
    setPriorite(0);
    setStatut("actif");
  };

  const openCreateForm = () => {
    resetForm();
    setFormMode("create");
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const openEditForm = (plan) => {
    setActivePlan(plan);
    setNomPlan(plan.nom_plan || "");
    setTypeCible(plan.type_cible || "produit");
    setDureeJours(plan.duree_jours ?? 1);
    setPrix(plan.prix ?? 0);
    setPriorite(plan.priorite ?? 0);
    setStatut(plan.statut || "actif");
    setFormMode("edit");
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    const token = getToken();
    if (!token) {
      setError("Vous devez être connecté(e) pour effectuer cette action.");
      setSubmitting(false);
      return;
    }

    if (!nomPlan.trim() || dureeJours < 1 || prix < 0 || priorite < 0) {
      setError("Tous les champs sont requis et doivent être valides.");
      setSubmitting(false);
      return;
    }

    const body = {
      nom_plan: nomPlan.trim(),
      type_cible: typeCible,
      duree_jours: Number(dureeJours),
      prix: Number(prix),
      priorite: Number(priorite),
      statut,
    };

    try {
      const url = formMode === "create"
        ? `${API_BASE}/admin/plans`
        : `${API_BASE}/admin/plans/${activePlan.id}`;
      const method = formMode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }

      setMessage(formMode === "create" ? "Plan créé avec succès." : "Plan modifié avec succès.");
      setShowForm(false);
      await loadPlans();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "Impossible de sauvegarder le plan tarifaire.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatutChange = async (plan, nextStatut) => {
    if (!plan?.id || plan.statut === nextStatut) return;

    const token = getToken();
    if (!token) {
      setError("Vous devez être connecté(e) pour modifier le statut.");
      return;
    }

    setSavingId(plan.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/admin/plans/${plan.id}/statut`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nextStatut }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }

      setPlans((current) =>
        current.map((item) =>
          item.id === plan.id ? { ...item, statut: nextStatut } : item,
        ),
      );
      setMessage(`Statut du plan « ${plan.nom_plan} » mis à jour.`);
    } catch (statutError) {
      console.error(statutError);
      setError(statutError.message || "Impossible de modifier le statut.");
    } finally {
      setSavingId(null);
    }
  };

  const activePlans = useMemo(() => plans.sort((a, b) => b.priorite - a.priorite || (a.prix - b.prix)), [plans]);

  return (
    <main className="plan-tarifs-page">
      <section className="plan-tarifs" aria-labelledby="admin-plans-title">
        <header className="plan-tarifs__header">
          <div>
            <span className="plan-tarifs__eyebrow">Administration</span>
            <h1 id="admin-plans-title">Gestion des plans tarifaires</h1>
            <p>Ajoutez, modifiez et suspendez des plans tarifaires pour les boutiques et produits.</p>
          </div>
          <div className="plan-tarifs__header-actions">
            <button className="btn teal btn-sm" type="button" onClick={openCreateForm}>
              Ajouter un plan
            </button>
          </div>
        </header>

        {message && <div className="plan-tarifs__notice">{message}</div>}
        {error && <div className="plan-tarifs__notice plan-tarifs__notice--error">{error}</div>}

        {showForm && (
          <div className="plan-tarifs__overlay">
            <div className="plan-tarifs__modal">
              <div className="plan-tarifs__modal-header">
                <div>
                  <h2>{formMode === "create" ? "Créer un nouveau plan" : "Modifier le plan"}</h2>
                  <p>Définissez le nom, la cible, la durée, le prix, la priorité et le statut.</p>
                </div>
                <button type="button" className="btn secondary btn-sm" onClick={() => setShowForm(false)}>
                  Fermer
                </button>
              </div>
              <form className="plan-tarifs__form" onSubmit={handleSubmit} autoComplete="off" noValidate>
                <div className="plan-tarif-fields">
                  <div className="plan-tarif-field">
                    <label>Nom du plan</label>
                    <input
                      value={nomPlan}
                      onChange={(event) => setNomPlan(event.target.value)}
                      required
                    />
                  </div>
                  <div className="plan-tarif-field">
                    <label>Cible</label>
                    <select value={typeCible} onChange={(event) => setTypeCible(event.target.value)}>
                      <option value="produit">Produit</option>
                      <option value="boutique">Boutique</option>
                    </select>
                  </div>
                  <div className="plan-tarif-field">
                    <label>Durée (jours)</label>
                    <input
                      type="number"
                      min="1"
                      value={dureeJours}
                      onChange={(event) => setDureeJours(Number(event.target.value))}
                      required
                    />
                  </div>
                  <div className="plan-tarif-field">
                    <label>Prix</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prix}
                      onChange={(event) => setPrix(Number(event.target.value))}
                      required
                    />
                  </div>
                  <div className="plan-tarif-field">
                    <label>Priorité</label>
                    <input
                      type="number"
                      min="0"
                      value={priorite}
                      onChange={(event) => setPriorite(Number(event.target.value))}
                      required
                    />
                  </div>
                  <div className="plan-tarif-field">
                    <label>Statut</label>
                    <select value={statut} onChange={(event) => setStatut(event.target.value)}>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                </div>
                <div className="plan-tarifs__actions">
                  <button className="btn teal btn-sm" type="submit" disabled={submitting}>
                    {submitting ? "Enregistrement…" : formMode === "create" ? "Créer le plan" : "Enregistrer les modifications"}
                  </button>
                  <button type="button" className="btn secondary btn-sm" onClick={() => setShowForm(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="plan-tarifs__toolbar">
          <p className="plan-tarifs__summary">
            <strong>{activePlans.length}</strong> plan{activePlans.length > 1 ? 's' : ''} tarifaire{activePlans.length > 1 ? 's' : ''} chargé{activePlans.length > 1 ? 's' : ''}.
          </p>
        </div>

        {loading ? (
          <div className="plan-tarifs__notice">Chargement des plans…</div>
        ) : (
          <div className="plan-tarifs__list">
            {activePlans.map((plan) => (
              <article className="plan-tarif-card" key={plan.id}>
                <div className="plan-tarif-card__content">
                  <h2 className="plan-tarif-card__title">{plan.nom_plan}</h2>
                  <div className="plan-tarif-card__details">
                    <div className="plan-tarif-card__detail">Cible : {plan.type_cible}</div>
                    <div className="plan-tarif-card__detail">Durée : {plan.duree_jours} jours</div>
                    <div className="plan-tarif-card__detail">Prix : {Number(plan.prix).toFixed(2)} €</div>
                    <div className="plan-tarif-card__detail">Priorité : {plan.priorite}</div>
                    <div className={`plan-tarif-card__status ${plan.statut === 'inactif' ? 'inactif' : ''}`}>{plan.statut}</div>
                  </div>
                  <div className="plan-tarif-card__meta">
                    <small>Modifié par : {plan.modefie_par ?? 'N/A'}</small>
                    <small>Créé : {new Date(plan.date_creation).toLocaleDateString('fr-FR')}</small>
                    <small>Mis à jour : {new Date(plan.date_maj).toLocaleDateString('fr-FR')}</small>
                  </div>
                </div>
                <div className="plan-tarif-card__actions">
                  <button className="btn teal btn-sm" type="button" onClick={() => openEditForm(plan)}>
                    Modifier
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
