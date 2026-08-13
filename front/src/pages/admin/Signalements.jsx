import "../../css/Signalements.css";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTokenPayload } from "../../store/authStore";

const API_BASE = "http://localhost:3000/admin";
const API_NOTIFICATIONS = "http://localhost:3000/notifications";

const TARGET_LINKS = {
  produit: (id) => `/produit/${id}`,
  boutique: (id) => `/boutique/${id}`,
};

const STATUT_OPTIONS = [
  { value: "ouvert", label: "Ouvert" },
  { value: "en_cours", label: "En cours" },
  { value: "resolu", label: "Résolu" },
  { value: "rejete", label: "Rejeté" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Toutes les cibles" },
  { value: "boutique", label: "Boutique" },
  { value: "produit", label: "Produit" },
  { value: "utilisateur", label: "Utilisateur" },
  { value: "avis", label: "Avis" },
  { value: "message", label: "Message" },
];

export default function SignalementsAdmin() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [search, setSearch] = useState("");
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [notificationMode, setNotificationMode] = useState("automatique");
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  const buildNotificationMessage = (signalement) => {
    const targetLabel = formatTargetLabel(signalement);
    return `Bonjour ${signalement.signalant_prenom ?? ""},\n\nNous avons bien reçu votre signalement (#${signalement.id_signalement}) concernant ${targetLabel}. Notre équipe l'examine et vous tiendra informé dès que possible.`;
  };

  const loadSignalements = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const token = getToken();
    if (!token) {
      setError("Vous devez être connecté(e) pour accéder à cette page admin.");
      setLoading(false);
      return;
    }

    const payload = getTokenPayload(token);
    if (!payload?.role || payload.role !== "admin") {
      setError("Accès refusé : vous devez être administrateur.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/signalements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      setSignalements(data ?? []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || "Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignalements();
  }, []);

  const formatTargetLabel = (signalement) => {
    if (signalement.type_cible === "boutique") {
      return signalement.boutique_nom ? `boutique ${signalement.boutique_nom}` : `boutique #${signalement.id_cible}`;
    }
    if (signalement.type_cible === "produit") {
      return signalement.produit_nom ? `produit ${signalement.produit_nom}` : `produit #${signalement.id_cible}`;
    }
    if (signalement.type_cible === "utilisateur") {
      return signalement.cible_utilisateur_prenom
        ? `utilisateur ${signalement.cible_utilisateur_prenom} ${signalement.cible_utilisateur_nom}`
        : `utilisateur #${signalement.id_cible}`;
    }
    return `${signalement.type_cible} #${signalement.id_cible}`;
  };

  const getTargetLink = (signalement) => {
    const builder = TARGET_LINKS[signalement.type_cible];
    return builder ? builder(signalement.id_cible) : null;
  };

  const openNotificationEditor = (signalement) => {
    setActiveNotificationId(signalement.id_signalement);
    setNotificationMessage(buildNotificationMessage(signalement));
    setNotificationLink(getTargetLink(signalement) ?? "/");
    setNotificationMode("automatique");
    setError("");
    setMessage("");
  };

  const closeNotificationEditor = () => {
    setActiveNotificationId(null);
    setNotificationMessage("");
    setNotificationLink("");
  };

  const handleSendNotification = async (signalement, contenu, lien) => {
    if (!signalement?.id_signalement || !signalement?.id_user) return;
    setSendingId(signalement.id_signalement);
    setError("");
    setMessage("");

    try {
      const token = getToken();
      const response = await fetch(API_NOTIFICATIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id_user: signalement.id_user,
          type: "signalement",
          contenu,
          lien,
          lu: false,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      setMessage("Notification envoyée à l'utilisateur ayant signalé.");
      closeNotificationEditor();
    } catch (notifyError) {
      console.error(notifyError);
      setError(notifyError.message || "Impossible d'envoyer la notification.");
    } finally {
      setSendingId(null);
    }
  };

  const handleStatusChange = async (signalementId, nextStatut) => {
    if (!signalementId || !nextStatut) return;
    const token = getToken();
    if (!token) {
      setError("Vous devez être connecté(e) pour modifier le statut.");
      return;
    }

    setSavingId(signalementId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/signalements/${signalementId}/status`, {
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
      setSignalements((current) =>
        current.map((item) =>
          item.id_signalement === signalementId ? { ...item, statut: nextStatut } : item,
        ),
      );
      setMessage("Statut du signalement mis à jour.");
    } catch (statusError) {
      console.error(statusError);
      setError(statusError.message || "Impossible de mettre à jour le statut.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredSignalements = useMemo(() => {
    return [...signalements]
      .filter((item) => {
        if (filterType !== "all" && item.type_cible !== filterType) return false;
        if (filterStatut !== "all" && item.statut !== filterStatut) return false;
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        return (
          item.motif?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          formatTargetLabel(item).toLowerCase().includes(term) ||
          `${item.signalant_prenom ?? ""} ${item.signalant_nom ?? ""}`.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
  }, [signalements, filterType, filterStatut, search]);

  return (
    <main className="signalements-page">
      <section className="signalements" aria-labelledby="admin-signalements-title">
        <header className="signalements__header">
          <div>
            <span className="signalements__eyebrow">Administration</span>
            <h1 id="admin-signalements-title">Signalements des utilisateurs</h1>
            <p>Filtrez les signalements, mettez à jour le statut et envoyez une notification personnalisée.</p>
          </div>
        </header>

        <div className="signalements__toolbar">
          <label className="signalements__filter">
            Recherche
            <input
              type="search"
              placeholder="Motif, description, cible ou signalant"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="signalements__filter">
            Type de cible
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="signalements__filter">
            Statut
            <select value={filterStatut} onChange={(event) => setFilterStatut(event.target.value)}>
              <option value="all">Tous les statuts</option>
              {STATUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message && <div className="signalements__notice">{message}</div>}
        {error && <div className="signalements__notice signalements__notice--error">{error}</div>}

        {loading ? (
          <div className="signalements__notice">Chargement des signalements…</div>
        ) : (
          <>
            <div className="signalements__summary">
              <strong>{filteredSignalements.length}</strong> signalement{filteredSignalements.length > 1 ? 's' : ''} affiché{filteredSignalements.length > 1 ? 's' : ''}
            </div>

            {filteredSignalements.length === 0 ? (
              <div className="signalements__empty">
                <h2>Aucun signalement ne correspond aux critères.</h2>
                <p>Essayez un autre filtre ou supprimez la recherche.</p>
              </div>
            ) : (
              <div className="signalements__table-wrapper">
                <table className="signalements__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Cible</th>
                      <th>Signalant</th>
                      <th>Motif</th>
                      <th>Statut</th>
                      <th>Notification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignalements.map((signalement) => {
                      const targetLink = getTargetLink(signalement);
                      const isActive = activeNotificationId === signalement.id_signalement;
                      return (
                        <Fragment key={signalement.id_signalement}>
                          <tr className="signalements__row">
                            <td>#{signalement.id_signalement}</td>
                            <td>{new Date(signalement.date_creation).toLocaleString('fr-FR')}</td>
                            <td>
                              <div className="signalements__target-cell">
                                <strong>{formatTargetLabel(signalement)}</strong>
                                {targetLink && (
                                  <Link className="signalements__link" to={targetLink}>
                                    Voir
                                  </Link>
                                )}
                              </div>
                            </td>
                            <td>{signalement.signalant_prenom} {signalement.signalant_nom}</td>
                            <td>{signalement.motif}</td>
                            <td>
                              <select
                                value={signalement.statut}
                                onChange={(event) => handleStatusChange(signalement.id_signalement, event.target.value)}
                                disabled={savingId === signalement.id_signalement}
                              >
                                {STATUT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button
                                className="btn teal btn-sm"
                                type="button"
                                onClick={() => openNotificationEditor(signalement)}
                              >
                                {isActive ? 'Modifier' : 'Notifier'}
                              </button>
                            </td>
                          </tr>
                          {isActive && (
                            <tr className="signalements__notification-row">
                              <td colSpan={7}>
                                <div className="signalements__notification-editor">
                                  <label>
                                    Message de notification
                                    <textarea
                                      rows={4}
                                      value={notificationMessage}
                                      onChange={(event) => {
                                        setNotificationMessage(event.target.value);
                                        setNotificationMode('personnalise');
                                      }}
                                    />
                                  </label>
                                  <label>
                                    Lien
                                    <input
                                      value={notificationLink}
                                      onChange={(event) => setNotificationLink(event.target.value)}
                                    />
                                  </label>
                                  <div className="signalements__notification-actions">
                                    <button
                                      className="btn secondary btn-sm"
                                      type="button"
                                      onClick={closeNotificationEditor}
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      className="btn teal btn-sm"
                                      type="button"
                                      onClick={() => handleSendNotification(signalement, notificationMessage, notificationLink)}
                                      disabled={sendingId === signalement.id_signalement}
                                    >
                                      {sendingId === signalement.id_signalement ? 'Envoi…' : 'Envoyer la notification'}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  );
}
