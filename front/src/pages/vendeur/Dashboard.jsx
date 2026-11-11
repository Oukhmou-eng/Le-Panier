import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/Dashboard.css';

const API_URL = 'http://localhost:3000';

function Dashboard() {
	const navigate = useNavigate();
	const token = localStorage.getItem('token');
	const idBoutique = localStorage.getItem('id_boutique');
	const [nomBoutique, setNomBoutique] = useState(localStorage.getItem('nom_boutique') || 'votre boutique');
	const [produits, setProduits] = useState([]);
	const [commandes, setCommandes] = useState([]);
	const [conversations, setConversations] = useState([]);
	const [avis, setAvis] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}

		const headers = { Authorization: `Bearer ${token}` };

		const loadDashboard = async () => {
			setLoading(true);
			setError('');
			try {
				const [productsResponse, boutiqueResponse, ordersResponse, conversationsResponse, reviewsResponse] = await Promise.all([
					fetch(`${API_URL}/produits/${idBoutique}/mes-produits`, { headers }),
					fetch(`${API_URL}/boutiques/mes-boutiques/${idBoutique}`, { headers }),
					fetch(`${API_URL}/commandes/boutique/${idBoutique}`, { headers }),
					fetch(`${API_URL}/messages/conversations`, { headers }),
					fetch(`${API_URL}/boutiques/${idBoutique}/avis`, { headers }),
				]);

				if (!productsResponse.ok) throw new Error(`Erreur HTTP ${productsResponse.status}`);
				if (!boutiqueResponse.ok) throw new Error(`Erreur HTTP ${boutiqueResponse.status}`);
				if (!ordersResponse.ok) throw new Error(`Erreur HTTP ${ordersResponse.status}`);
				if (!conversationsResponse.ok) throw new Error(`Erreur HTTP ${conversationsResponse.status}`);
				if (!reviewsResponse.ok) throw new Error(`Erreur HTTP ${reviewsResponse.status}`);

				const productsData = await productsResponse.json();
				const boutiqueData = await boutiqueResponse.json();
				const ordersData = await ordersResponse.json();
				const conversationsData = await conversationsResponse.json();
				const reviewsData = await reviewsResponse.json();
				const boutique = boutiqueData?.boutiques?.[0];

				setProduits(productsData?.produits ?? []);
				setCommandes(ordersData?.commandes ?? []);
				setConversations(Array.isArray(conversationsData) ? conversationsData : []);
				setAvis(reviewsData?.avis ?? []);
				if (boutique?.nom) setNomBoutique(boutique.nom);
			} catch (requestError) {
				console.error('Erreur lors du chargement du dashboard vendeur :', requestError);
				setError('Les données du dashboard sont momentanément indisponibles.');
			} finally {
				setLoading(false);
			}
		};

		if (idBoutique) {
			loadDashboard();
		} else {
			setError('Aucune boutique active sélectionnée.');
			setLoading(false);
		}
	}, [idBoutique, navigate, token]);

	const dashboardCards = [
		{ label: 'Produits', value: loading ? '…' : produits.length, detail: 'Gérez votre catalogue', href: '/mes-produits', tone: 'green' },
		{ label: 'Commandes reçues', value: loading ? '…' : commandes.length, detail: 'Consultez les nouvelles commandes', href: '/commandes-recues', tone: 'orange' },
		{ label: 'Messages', value: loading ? '…' : conversations.length, detail: 'Répondez à vos clients', href: '/messages-vendeur', tone: 'blue' },
		{ label: 'Avis clients', value: loading ? '…' : avis.length, detail: 'Suivez votre réputation', href: '/avis-clients', tone: 'purple' },
	];

	return (
		<main className="seller-dashboard">
			<section className="seller-dashboard__intro">
				<div>
					<span className="seller-dashboard__eyebrow">Espace vendeur</span>
					  <h1>{nomBoutique}</h1>
					<p>Voici un aperçu de l’activité de {nomBoutique}.</p>
				</div>
				<Link className="seller-dashboard__primary-action" to="/publierProduit">
					<span aria-hidden="true">+</span> Publier un produit
				</Link>
			</section>

			<section className="seller-dashboard__stats" aria-label="Résumé de l'activité">
				{dashboardCards.map((card) => (
					<Link className={`seller-dashboard__card seller-dashboard__card--${card.tone}`} to={card.href} key={card.label}>
						<span className="seller-dashboard__card-label">{card.label}</span>
						<strong>{card.value}</strong>
						<span className="seller-dashboard__card-detail">{card.detail} <span aria-hidden="true">→</span></span>
					</Link>
				))}
			</section>

			{error && <p className="seller-dashboard__error">{error}</p>}

			<section className="seller-dashboard__welcome">
				<div>
					<span className="seller-dashboard__eyebrow">Pour commencer</span>
					<h2>Développez votre activité</h2>
					<p>Ajoutez vos premiers produits et présentez votre boutique aux clients de la marketplace.</p>
				</div>
				<div className="seller-dashboard__actions">
					<Link to="/publierProduit">Ajouter un produit</Link>
					<Link to="/parametres-vendeur">Configurer la boutique</Link>
				</div>
			</section>
		</main>
	);
}

export default Dashboard;
