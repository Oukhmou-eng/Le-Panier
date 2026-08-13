import "../css/Boutique.css";

export default function ReportModal({
  isOpen,
  onClose,
  title,
  motif,
  description,
  setMotif,
  setDescription,
  onSubmit,
  statusMessage,
  errorMessage,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="hint">
          Merci de nous indiquer la raison. Notre équipe examinera votre signalement rapidement.
        </p>

        <label className="report-reason">
          <input
            type="radio"
            name="reportReason"
            value="contrefacon"
            checked={motif === "contrefacon"}
            onChange={(e) => setMotif(e.target.value)}
          />
          Produits contrefaits ou non conformes
        </label>
        <label className="report-reason">
          <input
            type="radio"
            name="reportReason"
            value="arnaque"
            checked={motif === "arnaque"}
            onChange={(e) => setMotif(e.target.value)}
          />
          Comportement suspect / arnaque
        </label>
        <label className="report-reason">
          <input
            type="radio"
            name="reportReason"
            value="contenu"
            checked={motif === "contenu"}
            onChange={(e) => setMotif(e.target.value)}
          />
          Contenu inapproprié
        </label>
        <label className="report-reason">
          <input
            type="radio"
            name="reportReason"
            value="autre"
            checked={motif === "autre"}
            onChange={(e) => setMotif(e.target.value)}
          />
          Autre raison
        </label>

        <div className="field" style={{ marginTop: "12px" }}>
          <label>Précisez (facultatif)</label>
          <textarea
            id="reportDetails"
            placeholder="Ajoutez des détails…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ minHeight: "70px" }}
          />
        </div>

        {statusMessage && <div className="report-status">{statusMessage}</div>}
        {errorMessage && <div className="report-error">{errorMessage}</div>}

        <div className="modal-actions">
          <button className="btn outline" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn danger-outline" type="button" onClick={onSubmit}>
            Envoyer le signalement
          </button>
        </div>
      </div>
    </div>
  );
}
