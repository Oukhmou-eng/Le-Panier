import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/AdminDashboard.css";

const API_URL = "http://localhost:3000/admin/dashboard";

const formatMAD = (value) => `${Number(value ?? 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const formatDate = (value) => value ? new Intl.DateTimeFormat("fr-MA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté pour accéder au tableau de bord.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `Erreur HTTP ${response.status}`);
        setDashboard(data);
      } catch (requestError) {
        setError(requestError.message || "Impossible de charger le tableau de bord.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.stats ?? {};
  const recents = dashboard?.recents ?? {};
  const cards = [
    { label: "Utilisateurs", value: stats.utilisateurs, detail: `+${stats.nouveaux_utilisateurs ?? 0} cette semaine`, icon: "👥", path: "/admin/users" },
    { label: "Boutiques actives", value: stats.boutiques_actives, detail: `${stats.categories_actives ?? 0} catégories actives`, icon: "🏪", path: "/admin/boutiques" },
    { label: "Revenus encaissés", value: formatMAD(stats.revenus_payes), detail: `${stats.factures_payees ?? 0} factures payées`, icon: "💳", path: "/admin/factures" },
    { label: "Signalements à traiter", value: stats.signalements_ouverts, detail: "Ouverts ou en cours", icon: "🚨", path: "/admin/signalements" },
  ];

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <span>Administration</span>
          <h1>Tableau de bord</h1>
          <p>Vue d’ensemble des activités récentes de la plateforme.</p>
        </div>
      </header>

      {loading && <div className="admin-dashboard__notice">Chargement du tableau de bord…</div>}
      {!loading && error && <div className="admin-dashboard__notice admin-dashboard__notice--error">{error}</div>}

      {!loading && !error && (
        <>
          <section className="admin-dashboard__stats" aria-label="Indicateurs principaux">
            {cards.map((card) => (
              <button className="admin-stat-card" type="button" key={card.label} onClick={() => navigate(card.path)}>
                <span className="admin-stat-card__icon">{card.icon}</span>
                <span className="admin-stat-card__label">{card.label}</span>
                <strong>{card.value ?? 0}</strong>
                <small>{card.detail}</small>
              </button>
            ))}
          </section>

          <section className="admin-dashboard__grid">
            <DashboardPanel title="Derniers utilisateurs" action="Voir les utilisateurs" onAction={() => navigate("/admin/users")}>
              {(recents.utilisateurs ?? []).map((user) => (
                <div className="admin-row" key={user.id_user}>
                  <div className="admin-row__avatar">{`${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() || "U"}</div>
                  <div><strong>{user.prenom} {user.nom}</strong><span>{user.email}</span></div>
                  <em className={`admin-status admin-status--${user.statut}`}>{user.statut}</em>
                </div>
              ))}
            </DashboardPanel>

            <DashboardPanel title="Dernières boutiques" action="Gérer les boutiques" onAction={() => navigate("/admin/boutiques")}>
              {(recents.boutiques ?? []).map((boutique) => (
                <div className="admin-row" key={boutique.id_boutique}>
                  <div className="admin-row__avatar admin-row__avatar--shop">🏪</div>
                  <div><strong>{boutique.nom}</strong><span>{boutique.nbr_abonnes ?? 0} abonnés · {formatDate(boutique.date_creation)}</span></div>
                  <em className={`admin-status admin-status--${boutique.statut}`}>{boutique.statut}</em>
                </div>
              ))}
            </DashboardPanel>

            <DashboardPanel title="Signalements récents" action="Voir les signalements" onAction={() => navigate("/admin/signalements")}>
              {(recents.signalements ?? []).map((signalement) => (
                <div className="admin-row" key={signalement.id_signalement}>
                  <div className="admin-row__avatar admin-row__avatar--alert">!</div>
                  <div><strong>{signalement.type_cible} · {signalement.motif}</strong><span>{formatDate(signalement.date_creation)}</span></div>
                  <em className={`admin-status admin-status--${signalement.statut}`}>{signalement.statut}</em>
                </div>
              ))}
            </DashboardPanel>

            <DashboardPanel title="Dernières factures" action="Voir les factures" onAction={() => navigate("/admin/factures")}>
              {(recents.factures ?? []).map((facture) => (
                <div className="admin-row" key={facture.id}>
                  <div className="admin-row__avatar admin-row__avatar--invoice">DH</div>
                  <div><strong>{facture.boutique_nom ?? "Boutique supprimée"}</strong><span>{facture.type_facture} · {formatDate(facture.date_facture)}</span></div>
                  <div className="admin-row__amount"><strong>{formatMAD(facture.montant)}</strong><em className={`admin-status admin-status--${facture.statut}`}>{facture.statut}</em></div>
                </div>
              ))}
            </DashboardPanel>
          </section>
        </>
      )}
    </main>
  );
}

function DashboardPanel({ title, action, onAction, children }) {
  return (
    <section className="admin-panel">
      <header><h2>{title}</h2><button type="button" onClick={onAction}>{action} →</button></header>
      <div className="admin-panel__list">{children}</div>
    </section>
  );
}