import "../../css/Boutique.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ReportModal from "../../components/ReportModal";

function Boutique(){




  const navigate = useNavigate();
  const { id } = useParams();
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [showAvisDialog, setShowAvisDialog] = useState(false);
 




  

  const [modalOpen, setModalOpen] = useState(false);
  const [ModalAvis, setModalAvis] = useState(false);
  const [note, setNote] = useState(5);
const [commentaire, setCommentaire] = useState("");

  const [afficherTousProduits, setAfficherTousProduits] = useState(true);

  const [boutique, setBoutique] = useState(null);
  const [produits, setProduits] = useState([]);
  const [avis, setAvis] = useState([]);
  const [motif, setMotif] = useState("");
  const [description, setDescription] = useState(""); 
  const [reportStatus, setReportStatus] = useState("");
  const [reportError, setReportError] = useState("");

  const [isFollowed, setIsFollowed] = useState(false); // état initial selon vos données
const [errorr, setErrorr] = useState(null);

const idb = id;



useEffect(() => {
  const fetchFollowStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // utilisateur non connecté, isFollowed reste false

    try {
      const response = await fetch(
        `http://localhost:3000/boutiques/${idb}/suiviestest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setIsFollowed(data.isFollowed);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du statut de suivi :", err);
    }
  };

  fetchFollowStatus();
}, [idb]);




const toggleFollow = async (boutiqueId) => {
  const token = localStorage.getItem("token");
   if (!token) {
    setShowAuthDialog(true); // au lieu de navigate direct
    return;
  }


  const wasFollowed = isFollowed;

  // Mise à jour optimiste
  setIsFollowed(!wasFollowed);
  setErrorr(null);

  try {
    const response = await fetch(
      `http://localhost:3000/boutiques/${boutiqueId}/suivies`,
      {
        method: wasFollowed ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Erreur de suivi");
  } catch (requestError) {
    console.error("Erreur lors de la mise à jour du suivi :", requestError);
    // Rollback
    setIsFollowed(wasFollowed);
    setErrorr("La mise à jour du suivi n'a pas pu être enregistrée.");
  }
};




  


  useEffect(() => {
    const chargerBoutique = async () => {
      try {
        const res = await fetch("http://localhost:3000/boutiques/detail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        // Informations de la boutique
        setBoutique(data.boutique);

        // Liste des produits avec leur éventuelle promotion active
        setProduits((data?.produits ?? []).map((produit) => {
          const prix = Number(produit.prix ?? 0);
          const prixPromo = produit.prix_promo === null || produit.prix_promo === undefined
            ? null
            : Number(produit.prix_promo);
          const discountPercent = produit.type_reduction === 'pourcentage'
            ? Number(produit.valeur_reduction ?? 0)
            : prixPromo !== null && prix > 0
              ? Math.round(((prix - prixPromo) / prix) * 100)
              : 0;

          return {
            ...produit,
            prix,
            prixPromo,
            discountPercent,
          };
        }));

      } catch (error) {
        console.error(error);
      }
    };

    chargerBoutique();
  }, [id]);

const handleGetA = async () => {
    try {
      const res = await fetch(`http://localhost:3000/boutiques/${id}/avis`);
      const data = await res.json();
      setAvis(data?.avis ?? []); 
      
    } catch (error) {
      console.error('An error ', error);
    }
  }

  useEffect(() => { handleGetA(); }, [id]); 



const handleAjouterAvis = async () => { 
    const token = localStorage.getItem("token");

if (!token) {
  setShowAvisDialog(true)
  return;
}
     try {
        const res = await fetch(`http://localhost:3000/boutiques/avis`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id,note, commentaire }),
        });

        const data = await res.json();
        console.log("Avis ajouté:", data);
        setNote(5); // Réinitialiser la note à 5 étoiles
        setCommentaire("");
        handleGetA(); // Rafraîchir la liste des avis après l'ajout

      } catch (error) {
        console.error(error);
      }
}
    




 const SignalerBoutique = async () => {
      try {
        setReportStatus("");
        setReportError("");
        const res = await fetch("http://localhost:3000/boutiques/signale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, motif, description }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Impossible d'envoyer le signalement.");
        }

        setReportStatus(data?.message || "Signalement envoyé avec succès.");
        setReportError("");
        setMotif("");
        setDescription("");
        fermerModal();
      } catch (error) {
        console.error(error);
        setReportError(error.message || "Une erreur est survenue pendant le signalement.");
      }
    };

  const handleVideoEnter = (event) => {
    const video = event.currentTarget.querySelector("video");
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  const handleVideoLeave = (event) => {
    const video = event.currentTarget.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  // URLs banniere/logo venant des données de la boutique renvoyées par le backend
  const bannerUrl = boutique?.banniere_url || "";
  const logoUrl = boutique?.logo_url || "";
  const infosBoutique = boutique?.infoboutique ?? boutique ?? {};

  const [bannerExists, setBannerExists] = useState(false);
  const [logoExists, setLogoExists] = useState(false);

  useEffect(() => {
    if (bannerUrl) {
      const img = new Image();
      img.onload = () => setBannerExists(true);
      img.onerror = () => setBannerExists(false);
      img.src = bannerUrl;
    } else {
      setBannerExists(false);
    }
  }, [bannerUrl]);

  useEffect(() => {
    if (logoUrl) {
      const img = new Image();
      img.onload = () => setLogoExists(true);
      img.onerror = () => setLogoExists(false);
      img.src = logoUrl;
    } else {
      setLogoExists(false);
    }
  }, [logoUrl]);

  const afficherP = () => {
    setAfficherTousProduits(true);
    setModalOpen(false);
    setModalAvis(false);
  }

  const ouvrirModal = () => {
    
      setModalOpen(true);
      setAfficherTousProduits(false);
      setModalAvis(false);
      setReportStatus("");
      setReportError("");
   
  }
  const ouvrirModalAvis = () => {
    
      setModalAvis(true);
      setAfficherTousProduits(false);
      setModalOpen(false);
   
  }

  const fermerModal = () => { setModalOpen(false); setAfficherTousProduits(true); }

  // Affichage des produits : 6 par défaut, puis tous au clic sur "Afficher tous les produits"
  const NB_PRODUITS_DEFAUT = 6;
  const [nombreProduitsAffiches, setNombreProduitsAffiches] = useState(NB_PRODUITS_DEFAUT);
  const produitsVisibles = produits.slice(0, nombreProduitsAffiches);
  const afficherTousLesProduits = () => setNombreProduitsAffiches(produits.length);

  return (
    <>
    <main className="main">

  <div
    className={`shop-banner ${bannerExists ? '' : 'no-banner'}`}
    id="shopBanner"
    style={bannerExists ? { backgroundImage: `url(${bannerUrl})` } : undefined}
  ></div>
  <div className="shop-head">
    

    <div
      className={`shop-logo ${logoExists ? '' : 'no-logo'}`}
      id="shopLogo"
    >
      {logoExists && <img src={logoUrl} alt={`Logo de ${boutique?.nom ?? "la boutique"}`} />}
    </div>
    <div className="shop-meta">
      <h1>{boutique?.nom}</h1>
      <div className="stars">
        ★★★★★ {boutique?.note_moyenne}{boutique?.estVerifier ? ' · Vendeur vérifié' : ''}
      </div>
    </div>
    <div className="shop-head-actions">
      <button
        className={`btn-follow ${isFollowed ? 'following' : ''}`}
        onClick={() => toggleFollow(Number(id))}
        aria-pressed={isFollowed}
      >
        {isFollowed ? '✓ Suivie' : '+ Suivre'}
      </button>
      <AuthDialog
        isOpen={showAuthDialog}
        onConfirm={() => {
          setShowAuthDialog(false);
          navigate('/login');
        }}
        onCancel={() => setShowAuthDialog(false)}
      />
    </div>
  </div>

  {(infosBoutique.adresse || infosBoutique.tele || infosBoutique.emailprof || infosBoutique.instagram || infosBoutique.facebook) && (
    <div className="shop-info-panel">
      {infosBoutique.adresse && (
        <div className="shop-info-card">
          <span>Adresse</span>
          <strong>{infosBoutique.adresse}</strong>
        </div>
      )}
      {infosBoutique.tele && (
        <div className="shop-info-card">
          <span>Téléphone</span>
          <strong>{infosBoutique.tele}</strong>
        </div>
      )}
      {infosBoutique.emailprof && (
        <div className="shop-info-card">
          <span>Email</span>
          <strong>{infosBoutique.emailprof}</strong>
        </div>
      )}
      {(infosBoutique.instagram || infosBoutique.facebook) && (
        <div className="shop-info-card shop-info-social">
          <span>Réseaux</span>
          <div className="shop-social">
            {infosBoutique.instagram && (
              <a
                href={infosBoutique.instagram.startsWith('http') ? infosBoutique.instagram : `https://www.instagram.com/${infosBoutique.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            )}
            {infosBoutique.facebook && (
              <a
                href={infosBoutique.facebook.startsWith('http') ? infosBoutique.facebook : `https://www.facebook.com/${infosBoutique.facebook.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )}

  <div className="shop-stats">
    <div>{produits.length}<span>Produits</span></div>
    <div>2.4k<span>Ventes</span></div>
    <div>98%<span>Satisfaction</span></div>
    <div>{boutique?.date_creation ? new Date(boutique.date_creation).getFullYear() : '—'}
<span>Sur Le Panier</span></div>
  </div>

  <div className="tabs">
    <button className="btn-report" onClick={() => afficherP()} >Produits</button>
    <button className="btn-report" onClick={() => ouvrirModalAvis()} >Avis ({avis.length})</button>
    <AvisDialog
          isOpen={showAvisDialog}
          onConfirm={() => {
            setShowAuthDialog(false);
            navigate('/login');
          }}
          onCancel={() => setShowAvisDialog(false)}
      />
    <button className="btn-report" onClick={() => ouvrirModal()} >⚑ Signaler</button>
  </div>

<>
  {afficherTousProduits && (

  <div id="shop-pane-produits">
    <div className="grid" >
      {produitsVisibles.map((produit) => {
        const estVideo = produit.type?.toLowerCase() === 'video';
        const estEnSolde = produit.prixPromo !== null && produit.prixPromo < produit.prix;
        return (
        
        <div
          className="card"
          key={produit.id_produit}
          onMouseEnter={handleVideoEnter}
          onMouseLeave={handleVideoLeave}
        >
          <div
            className="thumb"
            style={produit.url && !estVideo ? { backgroundImage: `url(${produit.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {estVideo && produit.url && (
              <video
                src={produit.url}
                muted
                loop
                playsInline
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {estEnSolde && produit.discountPercent > 0 && (
              <span className="solde-badge">-{produit.discountPercent}%</span>
            )}
            {estVideo && produit.url && (
              <span className="play" aria-label="Ce produit contient une vidéo">▶</span>
            )}
          </div>
          <div className="card-body">
            <div className="name">{produit.nom}</div>
            <div className="shop">{boutique?.nom}</div>
            {estEnSolde ? (
              <div className="solde-prices">
                <span className="price-old">{produit.prix} MAD</span>
                <span className="price">{produit.prixPromo} MAD</span>
              </div>
            ) : (
              <div className="price">{produit.prix} MAD</div>
            )}
          </div>
        </div>
        );
      })}
    </div>

    {nombreProduitsAffiches < produits.length && (
      <div className="show-more-wrap">
        <button className="btn outline" onClick={afficherTousLesProduits}>
          Afficher tous les produits ({produits.length})
        </button>
      </div>
    )}
  </div>
   )} </>

  



  <>
  {ModalAvis && (<div className="reviews-section">

    {/* ================= Ajouter un avis ================= */}

    <div className="add-review-card">

        <h3>Laisser votre avis</h3>

        <div className="star-picker">

            {[1,2,3,4,5].map((star)=>(

                <span
                    key={star}
                    className={star<=note ? "active" : ""}
                    onClick={()=>setNote(star)}
                >
                    ★
                </span>

            ))}

        </div>

        <div className="field">

            <label>Votre commentaire</label>

            <textarea
                value={commentaire}
                onChange={(e)=>setCommentaire(e.target.value)}
                placeholder="Partagez votre expérience avec cette boutique..."
            />

        </div>

        <div className="add-review-actions">

            <button
                className="btn teal"
                onClick={handleAjouterAvis}
            >
                Publier l'avis
            </button>

        </div>

    </div>


    {/* ================= Résumé ================= */}

    <div className="reviews-summary">

        <div>

            <div className="score">
                {boutique?.note_moyenne ?? "0.0"}
            </div>

            <div className="score-sub">
                sur 5
            </div>

        </div>

        <div>

            <div className="stars-big">

                {"★".repeat(Math.round(boutique?.note_moyenne || 0))}
                {"☆".repeat(5-Math.round(boutique?.note_moyenne || 0))}

            </div>

            <div className="score-sub">

                {avis.length} avis

            </div>

        </div>

    </div>


    {/* ================= Liste ================= */}

    <div className="reviews-list">

        {
            avis.length===0 ?

            <div className="no-review">

                Aucun avis pour cette boutique.

            </div>

            :

            avis.map((item,index)=>(

                <div
                    className="review"
                    key={index}
                >

                    <div className="avatar">

                        {
                            item.logo_url &&
                            <img
                                src={item.logo_url}
                                alt=""
                            />
                        }

                    </div>

                    <div className="review-content">

                        <div className="review-header">

                            <span className="review-user">

                                {item.prenom} {item.nom}

                            </span>

                            <span className="stars">

                                {"★".repeat(item.note)}
                                {"☆".repeat(5-item.note)}

                            </span>

                        </div>

                        <p>

                            {item.commentaire}

                        </p>

                    </div>

                </div>

            ))
        }

    </div>

</div>) }
  
  
  </>




</main>

      <ReportModal
        isOpen={modalOpen}
        onClose={fermerModal}
        title="Signaler cette boutique"
        motif={motif}
        description={description}
        setMotif={setMotif}
        setDescription={setDescription}
        onSubmit={SignalerBoutique}
        statusMessage={reportStatus}
        errorMessage={reportError}
      />

    </>

    );
}

export default Boutique;



 const AuthDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h3>Connexion requise</h3>
        <p>Vous devez être connecté pour suivre cette boutique. Voulez-vous vous connecter ?</p>
        <div className="dialog-actions">
          <button onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};




 const AvisDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h3>Connexion requise</h3>
        <p>Vous devez être connecté pour commenter cette boutique. Voulez-vous vous connecter ?</p>
        <div className="dialog-actions">
          <button onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};
