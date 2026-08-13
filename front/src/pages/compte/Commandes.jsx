import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommandesUtilisateur } from '../../services/commandeService';
import '../../css/Commandes.css';

// fetch current user commandes from token-authenticated endpoint

const filters = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'cours', label: 'En cours' },
  { key: 'livrees', label: 'Livrées' },
  { key: 'annulees', label: 'Annulées' },
];

const statusLabels = {
  en_attente: 'En attente',
  confirmee: 'Préparation',
  expediee: 'En transit',
  livree: 'Livrée',
  annulee: 'Annulée',
  remboursee: 'Remboursée',
};

const statusClasses = {
  en_attente: 'pending',
  confirmee: 'pending',
  expediee: 'pending',
  livree: 'ok',
  annulee: 'cancel',
  remboursee: 'cancel',
};

const matchesFilter = (commande, filter) => {
  if (filter === 'toutes') return true;
  if (filter === 'cours') return ['en_attente', 'confirmee', 'expediee'].includes(commande.statut);
  if (filter === 'livrees') return commande.statut === 'livree';
  return ['annulee', 'remboursee'].includes(commande.statut);
};

const formatDate = (value) => new Intl.DateTimeFormat('fr-MA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(value));

function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [filter, setFilter] = useState('toutes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');



  
  useEffect(() => {
    const loadCommandes = async () => {
      try {
        setLoading(true);
        setError('');
        setCommandes(await getCommandesUtilisateur());
      } catch (requestError) {
        setError(requestError.message || 'Impossible de charger vos commandes.');
        setCommandes([]);
      } finally {
        setLoading(false);
      }
    };

    loadCommandes();
  }, []);

  const filteredCommandes = useMemo(
    () => commandes.filter((commande) => matchesFilter(commande, filter)),
    [commandes, filter],
  );

  const countFor = (key) => commandes.filter((commande) => matchesFilter(commande, key)).length;

  return (
    <main className="content-area commandes-page">
      <section className="cview active" aria-labelledby="commandes-title">
        <div className="topline">
          <div>
            <span className="kicker">Achats</span>
            <h1 id="commandes-title">Mes commandes</h1>
          </div>
        </div>

        <div className="order-tabs" role="tablist" aria-label="Filtrer les commandes">
          {filters.map((item) => (
            <button
              type="button"
              className={`order-tab ${filter === item.key ? 'active' : ''}`}
              onClick={() => setFilter(item.key)}
              role="tab"
              aria-selected={filter === item.key}
              key={item.key}
            >
              {item.label} ({countFor(item.key)})
            </button>
          ))}
        </div>

        {loading && <div className="orders-notice">Chargement des commandes…</div>}
        {!loading && error && <div className="orders-notice orders-notice--error">{error}</div>}
        {!loading && !error && filteredCommandes.length === 0 && (
          <div className="orders-notice">Aucune commande ne correspond à ce filtre.</div>
        )}

        {!loading && !error && filteredCommandes.length > 0 && (
          <div className="panel-card orders-list">
            {filteredCommandes.map((commande) => {
              const isDelivered = commande.statut === 'livree';
              const isCancelled = ['annulee', 'remboursee'].includes(commande.statut);

              return (
                <article className="order-card" key={commande.id_commande}>
                  <div className="list-thumb" aria-hidden="true">
                    {commande.image_url && <img src={commande.image_url} alt="" />}
                  </div>
                  <div className="meta">
                    <div className="title">{commande.produit_nom}</div>
                    <div className="sub">
                      #CMD-{commande.id_commande} · {commande.boutique_nom || 'Boutique'} · Commandée le {formatDate(commande.date_commande)}
                    </div>
                  </div>
                  <div className="price">{Number(commande.montant_total).toLocaleString('fr-MA')} MAD</div>
                  <div className="rightv">
                    <span className={`status-chip ${statusClasses[commande.statut] || 'pending'}`}>
                      {statusLabels[commande.statut] || commande.statut}
                    </span>
                    {!isDelivered && !isCancelled && <Link className="link-sub" to="/suivi-commandes">Suivre →</Link>}
                    {isDelivered && <Link className="link-sub" to={`/produit/${commande.id_produit}`}>Voir le produit</Link>}
                    {isCancelled && <Link className="link-sub" to={`/produit/${commande.id_produit}`}>Recommander</Link>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}


export default Commandes;