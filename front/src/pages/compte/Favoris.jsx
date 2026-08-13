import '../../css/Favoris.css';
import '../../css/Home.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Favoris() {
  const [produits, setProduits] = useState([]);
  const [favoris, setFavoris] = useState(new Set());
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const chargerFavoris = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setError('');
      const res = await fetch('http://localhost:3000/favoris/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

      const data = await res.json();
      const items = data?.produitsVedette ?? [];
      setProduits(items);
      setFavoris(new Set(items.map((produit) => produit.id_produit)));
    } catch (requestError) {
      console.error('Erreur lors du chargement des favoris :', requestError);
      setProduits([]);
      setFavoris(new Set());
      setError('Impossible de charger vos favoris pour le moment.');
    }
  };

  useEffect(() => {
    chargerFavoris();
  }, []);

  const toggleFavori = async (produitId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const estFavori = favoris.has(produitId);
    setFavoris((current) => {
      const next = new Set(current);
      if (estFavori) next.delete(produitId);
      else next.add(produitId);
      return next;
    });

    try {
      const res = await fetch(`http://localhost:3000/favoris/${produitId}`, {
        method: estFavori ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

      if (estFavori) {
        setProduits((current) => current.filter((produit) => produit.id_produit !== produitId));
      }
    } catch (requestError) {
      console.error('Erreur lors de la mise à jour des favoris :', requestError);
      setFavoris((current) => {
        const next = new Set(current);
        if (estFavori) next.add(produitId);
        else next.delete(produitId);
        return next;
      });
      setError('La mise à jour du favori a échoué.');
    }
  };

  const normaliserProduit = (produit) => {
    const prix = Number(produit.prix ?? 0);
    const prixPromo = produit.prix_promo === null || produit.prix_promo === undefined
      ? null
      : Number(produit.prix_promo);

    return {
      ...produit,
      prix,
      prixPromo,
      reductionPourcentage: produit.type_reduction === 'pourcentage'
        ? Number(produit.valeur_reduction ?? 0)
        : prixPromo !== null && prix > 0
          ? Math.round(((prix - prixPromo) / prix) * 100)
          : 0,
    };
  };

  return (
    <main className='content-area'>
      <section className='cview active' id='page-favoris'>
        <div className='topline'>
          <div>
            <span className='kicker'>Envies</span>
            <h1>Favoris</h1>
          </div>
          <button type='button' className='link-sub' onClick={() => navigate('/catalogue')}>
            Voir le catalogue →
          </button>
        </div>

        {error && <p>{error}</p>}

        <div className='grid' id='homeGrid'>
          {produits.map((produit) => {
            const estFavori = favoris.has(produit.id_produit);
            const produitNormalise = normaliserProduit(produit);
            const estEnSolde = produitNormalise.prixPromo !== null
              && produitNormalise.prixPromo < produitNormalise.prix;
            return (
              <div key={produit.id_produit} className='card' onClick={() => navigate(`/produit/${produit.id_produit}`)}>
                <div className='thumb'>
                  {estEnSolde && produitNormalise.reductionPourcentage > 0 && (
                    <span className='home-solde-badge'>-{produitNormalise.reductionPourcentage}%</span>
                  )}
                  {produit.type?.toLowerCase().startsWith('video') ? (
                    <video
                      src={produit.url}
                      muted
                      loop
                      playsInline
                      onMouseOver={(event) => event.target.play()}
                      onMouseOut={(event) => {
                        event.target.pause();
                        event.target.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img src={produit.url} alt={produit.nom} />
                  )}
                  {produit.type?.toLowerCase().startsWith('video') && <span className='play'>▶</span>}
                </div>
                <div className='card-body'>
                  <button
                    type='button'
                    className={`fav-btn ${estFavori ? 'fav-active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavori(produit.id_produit);
                    }}
                    aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  />
                  <div className='name'>{produit.nom}</div>
                  <div className='shop'>{produit.boutique_nom}</div>
                  {estEnSolde ? (
                    <div className='home-solde-prices'>
                      <span className='home-price-old'>{produitNormalise.prix} MAD</span>
                      <span className='price'>{produitNormalise.prixPromo} MAD</span>
                    </div>
                  ) : (
                    <div className='price'>{produitNormalise.prix} MAD</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!error && produits.length === 0 && (
          <div>
            <h2>Aucun favori pour le moment</h2>
            <p>Cliquez sur le cœur d’un produit pour le retrouver ici.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Favoris;
