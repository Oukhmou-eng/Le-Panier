import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const API_BASE_URL = 'http://localhost:3000/promotions/admin/factures';

export default function FacturesBoutiques() {
  const [factures, setFactures] = useState([]);
  const [filter, setFilter] = useState('toutes');
  const [statutFilter, setStatutFilter] = useState('toutes');
  const [search, setSearch] = useState('');
  const [periode, setPeriode] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerFactures();
  }, []);

  const chargerFactures = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour voir les factures.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Erreur HTTP ${res.status}`);
      }
      const data = await res.json();
      setFactures(data ?? []);
    } catch (err) {
      setError(err.message || 'Impossible de charger les factures.');
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFactures = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return factures.filter((facture) => {
      const label = facture.type_facture || '';
      const statut = facture.statut || '';
      const matchFilter = filter === 'toutes' || label === filter;
      const matchStatut = statutFilter === 'toutes' || statut === statutFilter;
      const matchSearch =
        normalizedSearch === '' ||
        facture.boutique_nom?.toLowerCase().includes(normalizedSearch) ||
        facture.reference_transaction?.toLowerCase().includes(normalizedSearch);
      return matchFilter && matchStatut && matchSearch;
    });
  }, [factures, filter, statutFilter, search]);

  const donnees = useMemo(() => {
    const totalsByDay = filteredFactures.reduce((acc, facture) => {
      // L'API renvoie une date SQL ou ISO : les dix premiers caractères sont toujours YYYY-MM-DD.
      const dateKey = facture.date_facture?.slice(0, 10);
      if (!dateKey) return acc;

      acc[dateKey] = (acc[dateKey] || 0) + Number(facture.montant || 0);
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - periode + 1);
    const formatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' });
    const toDateKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return Array.from({ length: periode }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dateKey = toDateKey(date);

      return {
        date: formatter.format(date),
        montant: totalsByDay[dateKey] ?? 0,
      };
    });
  }, [filteredFactures, periode]);

  const hasChartData = donnees.some((item) => Number(item.montant) > 0);

  const chiffreAffaires = filteredFactures.reduce((sum, facture) => sum + Number(facture.montant || 0), 0);
  const facturesPayees = filteredFactures.filter((facture) => facture.statut === 'paye').length;
  const facturesEnAttente = filteredFactures.filter((facture) => facture.statut === 'en_attente').length;

  const maxMontant = donnees.reduce((max, item) => Math.max(max, Number(item.montant || 0)), 0);
  const yDomain = maxMontant > 0 ? [0, Math.ceil(maxMontant * 1.1)] : [0, 10];

  const formatMAD = (value) =>
    typeof value === 'number' ? `${value.toLocaleString('fr-FR')} MAD` : '—';

  return (
    <main className="stats-page">
      <style>{css}</style>

      <div className="stats-topline">
        <div>
          <span className="stats-kicker">Admin / Factures</span>
          <h1>Factures boutiques</h1>
        </div>
      </div>

      {error && <div className="stats-alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Factures totales" value={factures.length} />
        <StatCard label="Montant total payé" value={formatMAD(chiffreAffaires)} />
        <StatCard label="Factures payées" value={facturesPayees} />
        <StatCard label="En attente" value={facturesEnAttente} />
      </div>

      <div className="stats-chart-card">
        <div className="stats-chart-header">
          <div className="stats-chart-title">Montant des factures par jour</div>
          <select
            className="stats-select"
            value={periode}
            onChange={(e) => setPeriode(Number(e.target.value))}
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
          </select>
        </div>
        <div className="stats-chart-body">
          {loading ? (
            <div className="stats-chart-placeholder">Chargement…</div>
          ) : !hasChartData ? (
            <div className="stats-chart-placeholder">Aucune donnée de factures.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={donnees} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="facturesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="4 4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                  tickFormatter={(value) => `${Number(value).toLocaleString('fr-FR')} MAD`}
                  width={70}
                  domain={yDomain}
                />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} MAD`, 'Montant']} />
                <Area
                  type="monotone"
                  dataKey="montant"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fill="url(#facturesGradient)"
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#0f766e', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="stats-table-card">
        <div className="table-controls">
          <div>
            <label>Filtrer par type :</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="toutes">Toutes</option>
              <option value="promotion">Promotion</option>
              <option value="publicite">Publicité</option>
              <option value="abonnement">Abonnement</option>
            </select>
          </div>
          <div>
            <label>Filtrer par statut :</label>
            <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              <option value="toutes">Toutes</option>
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
            </select>
          </div>
          <div>
            <label>Rechercher :</label>
            <input
              type="text"
              placeholder="Boutique, transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="stats-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Boutique</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Référence</th>
              <th>Date facture</th>
              <th>Date paiement</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="stats-table-empty">Chargement…</td>
              </tr>
            ) : filteredFactures.length === 0 ? (
              <tr>
                <td colSpan={8} className="stats-table-empty">Aucune facture trouvée.</td>
              </tr>
            ) : (
              filteredFactures.map((facture) => (
                <tr key={facture.id}>
                  <td>{facture.id}</td>
                  <td>{facture.boutique_nom ?? facture.boutique_id}</td>
                  <td>{facture.type_facture}</td>
                  <td>{formatMAD(Number(facture.montant || 0))}</td>
                  <td>{facture.statut}</td>
                  <td>{facture.reference_transaction}</td>
                  <td>{facture.date_facture}</td>
                  <td>{facture.date_paiement ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stats-card">
      <div className="stats-card-label">{label}</div>
      <div className="stats-card-value">{value}</div>
    </div>
  );
}

const css = `
  .stats-page {
    --stats-accent: #0f766e;
    --stats-text: #111827;
    --stats-text-muted: #6b7280;
    --stats-line: #e5e7eb;
    --stats-bg-card: #ffffff;
    font-family: 'Sora', sans-serif;
    color: var(--stats-text);
    padding: 28px 32px;
    background: #f7f8fa;
  }
  .stats-topline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .stats-kicker {
    display: block;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--stats-accent);
    font-weight: 600;
    margin-bottom: 6px;
  }
  .stats-topline h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }
  .stats-card {
    background: var(--stats-bg-card);
    border: 1px solid var(--stats-line);
    border-radius: 16px;
    padding: 18px;
  }
  .stats-card-label {
    font-size: 13px;
    color: var(--stats-text-muted);
    margin-bottom: 8px;
  }
  .stats-card-value {
    font-size: 24px;
    font-weight: 700;
  }
  .stats-alert-error {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    padding: 14px 18px;
    border-radius: 12px;
    margin-bottom: 20px;
  }
  .stats-chart-card,
  .stats-table-card {
    background: var(--stats-bg-card);
    border: 1px solid var(--stats-line);
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .stats-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .stats-chart-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--stats-text);
  }
  .stats-chart-body {
    min-height: 280px;
  }
  .stats-chart-placeholder {
    display: grid;
    place-items: center;
    min-height: 240px;
    color: var(--stats-text-muted);
  }
  .table-controls {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .table-controls label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--stats-text-muted);
  }
  .table-controls select,
  .table-controls input {
    width: 100%;
    max-width: 300px;
    padding: 10px 12px;
    border: 1px solid var(--stats-line);
    border-radius: 12px;
    font-family: 'Sora';
    font-size: 14px;
    color: var(--stats-text);
    background: #fff;
  }
  .stats-table {
    width: 100%;
    border-collapse: collapse;
  }
  .stats-table th,
  .stats-table td {
    text-align: left;
    padding: 14px 12px;
    border-bottom: 1px solid var(--stats-line);
    font-size: 14px;
  }
  .stats-table th {
    color: var(--stats-text-muted);
    font-weight: 700;
  }
  .stats-table-empty {
    text-align: center;
    padding: 40px 0;
    color: var(--stats-text-muted);
  }
`;
