import { useEffect, useMemo, useState } from 'react';
import '../../css/CommandesRecues.css';

const API_URL = 'http://localhost:3000';

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'expediee', label: 'Expédiée' },
  { value: 'livree', label: 'Livrée' },
  { value: 'annulee', label: 'Annulée' },
  { value: 'remboursee', label: 'Remboursée' },
];

const TABS = [
  { key: 'all', label: 'Toutes', filter: () => true },
  { key: 'pending', label: 'À traiter', filter: (order) => order.statut === 'en_attente' },
  { key: 'processing', label: 'En cours', filter: (order) => ['confirmee', 'expediee'].includes(order.statut) },
  { key: 'delivered', label: 'Livrées', filter: (order) => order.statut === 'livree' },
];

function CammandesRecues() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem('token');
  const boutiqueId = localStorage.getItem('id_boutique');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/commandes/boutique/${boutiqueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Erreur HTTP ${res.status}`);
      }
      const data = await res.json();
      setOrders(data?.commandes ?? []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les commandes reçues.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boutiqueId) loadOrders();
  }, [boutiqueId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = `${order.client_nom ?? ''} ${order.client_prenom ?? ''} ${order.produit_nom ?? ''} ${order.id_commande ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const activeTabDefinition = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
      const matchesTab = activeTabDefinition.filter(order);
      return matchesSearch && matchesTab;
    });
  }, [orders, search, activeTab]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/commandes/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Erreur HTTP ${res.status}`);
      }
      setOrders((current) => current.map((order) => order.id_commande === orderId ? { ...order, statut: newStatus } : order));
    } catch (err) {
      console.error(err);
      setError(err.message || 'La mise à jour du statut a échoué.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <main className="commandes-recues-page">
      <div className="page-header">
        <div>
          <div className="page-label">VENTES</div>
          <h1>Commandes reçues</h1>
          <p className="muted">Historique des commandes pour votre boutique, trié par nouveauté.</p>
        </div>
      </div>

      <div className="tabs-row">
        {TABS.map((tab) => {
          const count = orders.filter(tab.filter).length;
          return (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <strong>{tab.label}</strong>
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Rechercher commande, client ou produit"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty">Chargement…</div>
      ) : error ? (
        <div className="empty">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty">Aucune commande ne correspond à votre recherche.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const clientName = [order.client_nom, order.client_prenom].filter(Boolean).join(' ') || 'Client inconnu';
                const initials = clientName
                  .split(' ')
                  .filter(Boolean)
                  .map((part) => part[0]?.toUpperCase())
                  .slice(0, 2)
                  .join('');

                return (
                  <tr key={order.id_commande}>
                    <td>
                      <div className="order-label">#{order.id_commande}</div>
                      <div className="order-date">{formatDate(order.date_commande)}</div>
                    </td>
                    <td>
                      <div className="client-cell">
                        <span className="client-avatar">{initials || 'U'}</span>
                        <span>{clientName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${order.statut || 'en_attente'}`}>{order.statut || 'en_attente'}</span>
                    </td>
                    <td className="amount-cell">{Number(order.montant_total || 0).toLocaleString('fr-MA')} MAD</td>
                    <td>
                      <select
                        className="status-select"
                        aria-label={`Modifier le statut de la commande ${order.id_commande}`}
                        value={order.statut || 'en_attente'}
                        disabled={updatingId === order.id_commande}
                        onChange={(event) => handleStatusChange(order.id_commande, event.target.value)}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default CammandesRecues;
