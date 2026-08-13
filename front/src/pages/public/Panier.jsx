import "../../css/Panier.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPanier, getPanierEnregistres, removeFromPanier, restoreFromSaved, saveForLater, updatePanierQuantity, placeOrder } from "../../services/panierService";

/* =========================================================
   Structure attendue pour chaque article de panier, renvoyée
   par GET /panier (à adapter selon la vraie forme de réponse
   du backend, comme pour les autres pages) :
   {
     id, shopId, shopName, shopLogo, productId,
     name, variant, price, qty, image, stock
   }
   ========================================================= */

const FREE_SHIPPING_THRESHOLD = 700; // DH — TODO: confirmer la règle côté backend
const SHIPPING_FEE = 25; // DH — TODO: remplacer par le calcul réel (zone, poids, etc.)

function Panier() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(null); // { code, discount }
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState({ prenom: "", nom: "", telephone: "", adresse: "", ville: "", codePostal: "" });
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);

  /* =========================================================
     Chargement des données au montage — c'est ce qui rend la
     page réellement dynamique : rien n'est codé en dur, tout
     vient de l'API.
     ========================================================= */

  const mapCartItem = (item) => {
    const price = Number(item.prix);
    const salePrice = item.prix_promo === null || item.prix_promo === undefined ? null : Number(item.prix_promo);
    const isOnSale = salePrice !== null && salePrice < price;
    const discountPercent = isOnSale
      ? item.type_reduction === 'pourcentage'
        ? Number(item.valeur_reduction ?? 0)
        : Math.round(((price - salePrice) / price) * 100)
      : 0;

    return {
      id: item.id,
      shopId: item.id_boutique,
      shopName: item.boutique_nom,
      shopLogo: item.boutique_logo_url ?? null,
      productId: item.id_produit,
      name: item.nom,
      variant: item.variante ?? "",
      price,
      salePrice,
      saleType: item.type_reduction,
      saleDiscountPercent: discountPercent,
      saleEnd: item.date_fin,
      isOnSale,
      displayPrice: isOnSale ? salePrice : price,
      qty: Number(item.quantite),
      image: item.image_url,
      stock: Number(item.stock),
    };
  };

  const fetchCart = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [items, saved] = await Promise.all([getPanier(), getPanierEnregistres()]);
      setCartItems(items.map(mapCartItem));
      setSavedItems(saved.map(mapCartItem));
    } catch (error) {
      console.error("Erreur lors du chargement du panier", error);
      setLoadError(error.message || "Impossible de charger votre panier pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (item, delta) => {
    const quantity = item.qty + delta;
    if (quantity < 1 || quantity > item.stock) return;
    try {
      await updatePanierQuantity(item.id, quantity);
      setCartItems((items) => items.map((current) => current.id === item.id ? { ...current, qty: quantity } : current));
    } catch (error) {
      setLoadError(error.message || "Impossible de mettre à jour la quantité.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromPanier(itemId);
      setCartItems((items) => items.filter((item) => item.id !== itemId));
    } catch (error) {
      setLoadError(error.message || "Impossible de retirer cet article.");
    }
  };

  const handleSaveForLater = async (itemId) => {
    try {
      await saveForLater(itemId);
      await fetchCart();
    } catch (error) {
      setLoadError(error.message || "Impossible d'enregistrer cet article.");
    }
  };

  const handleRestoreItem = async (itemId) => {
    try {
      await restoreFromSaved(itemId);
      await fetchCart();
    } catch (error) {
      setLoadError(error.message || "Impossible de remettre cet article au panier.");
    }
  };

  const handleApplyPromo = () => setPromoApplied(null);

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode("");
  };

  const handleGoToShipping = () => { setCheckoutMessage(""); setCheckoutStep(1); setCheckoutOpen(true); };

  const validateDelivery = () => {
    const required = [delivery.prenom, delivery.nom, delivery.telephone, delivery.adresse, delivery.ville, delivery.codePostal];
    if (required.some((value) => !value.trim())) {
      setCheckoutMessage("Complétez votre adresse de livraison avant de continuer.");
      return false;
    }
    if (!/^[+0-9 ()-]{8,25}$/.test(delivery.telephone.trim()) || !/^[A-Za-z0-9 -]{3,20}$/.test(delivery.codePostal.trim())) {
      setCheckoutMessage("Vérifiez le téléphone et le code postal.");
      return false;
    }
    return true;
  };

  const isValidCardNumber = (value) => {
    const digits = value.replace(/[\s-]/g, "");
    if (!/^\d{13,19}$/.test(digits)) return false;
    return digits.split("").reverse().reduce((sum, digit, index) => {
      let current = Number(digit);
      if (index % 2 === 1) current = current > 4 ? current * 2 - 9 : current * 2;
      return sum + current;
    }, 0) % 10 === 0;
  };

  const validatePayment = () => {
    if (paymentMethod !== "card") return true;
    if ([card.name, card.number, card.expiry, card.cvc].some((value) => !value.trim()) || !isValidCardNumber(card.number)) {
      setCheckoutMessage("Vérifiez les informations de votre carte.");
      return false;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry) || !/^\d{3,4}$/.test(card.cvc)) {
      setCheckoutMessage("Vérifiez la date d’expiration et le CVC.");
      return false;
    }
    const [month, year] = card.expiry.split("/").map(Number);
    if (new Date(2000 + year, month, 0) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) {
      setCheckoutMessage("Cette carte est expirée.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateDelivery()) {
      setCheckoutMessage("");
      setCheckoutStep(2);
    }
  };

  const handlePlaceOrder = () => {
    if (!validateDelivery() || !validatePayment()) return;
    const required = [delivery.prenom, delivery.nom, delivery.telephone, delivery.adresse, delivery.ville, delivery.codePostal];
    if (required.some((value) => !value.trim())) {
      setCheckoutMessage("Complétez votre adresse de livraison avant de confirmer.");
      document.getElementById("checkout-delivery")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (paymentMethod === "card" && [card.name, card.number, card.expiry, card.cvc].some((value) => !value.trim())) {
      setCheckoutMessage("Complétez les informations de votre carte.");
      document.getElementById("checkout-payment")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setCheckoutMessage("Traitement de la commande…");
    setIsPlacing(true);
    (async () => {
      try {
        const adressePayload = {
          ligne1: delivery.adresse,
          ville: delivery.ville,
          code_postal: delivery.codePostal,
          tele: delivery.telephone,
          libelle: `${delivery.prenom} ${delivery.nom}`,
        };

        const paiementPayload = paymentMethod === 'card' ? {
          methode: 'carte',
          fournisseur: 'simulation',
          carte: { nom: card.name, numero: card.number, expiration: card.expiry, cvc: card.cvc }
        } : { methode: 'cod', fournisseur: 'livraison' };

        const payload = {
          adresse: adressePayload,
          paiement: paiementPayload,
          note,
          shippingMethod,
        };

        const res = await placeOrder(payload);
        setCheckoutMessage('Commande passée avec succès. Référence: ' + (res.reference_transaction ?? res.id_commande));
        setCheckoutOpen(false);
        await fetchCart();
        navigate('/mes-commandes');
      } catch (error) {
        setCheckoutMessage(error.message || 'Erreur lors du traitement de la commande.');
      } finally {
        setIsPlacing(false);
      }
    })();
  };
  const groupedByShop = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      if (!groups[item.shopId]) {
        groups[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          shopLogo: item.shopLogo,
          items: [],
        };
      }
      groups[item.shopId].items.push(item);
    });
    return Object.values(groups);
  }, [cartItems]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.displayPrice * item.qty, 0);
  const discount = promoApplied?.discount ?? 0;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  const isEmpty = cartItems.length === 0;

  /* =========================================================
     Rendu
     ========================================================= */

  if (isLoading) {
    return (
      <main className="panier-page">
        <div className="wrap">
          <p className="loading-state">Chargement de votre panier…</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="panier-page">
        <div className="wrap">
          <div className="error-state">
            <p>{loadError}</p>
            <button className="btn teal" onClick={fetchCart}>
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="panier-page">
      <div className="steps">
        <div className="steps-inner">
          <div className="step active">
            <span className="num">1</span>
            <span className="label">Panier</span>
          </div>
          <div className="step-sep"></div>
          <div className="step">
            <span className="num">2</span>
            <span className="label">Livraison</span>
          </div>
          <div className="step-sep"></div>
          <div className="step">
            <span className="num">3</span>
            <span className="label">Paiement</span>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="page-head">
          <h1>Finaliser ma commande</h1>
          <span className="count">
            {totalItems} article{totalItems > 1 ? "s" : ""}
          </span>
        </div>

        {!isEmpty && (
          <div className="shipping-bar">
            {shippingFee === 0 ? (
              <div className="txt">
                <b>Livraison gratuite</b> appliquée à votre commande
              </div>
            ) : (
              <div className="txt">
                Plus que <b>{remainingForFreeShipping} DH</b> d'achat pour la
                livraison gratuite
              </div>
            )}
            <div className="track">
              <div className="fill" style={{ width: `${shippingProgress}%` }}></div>
            </div>
          </div>
        )}

        {isEmpty ? (
          <div className="empty-state">
            <div className="ico">
              <svg viewBox="0 0 24 24" className="icn" style={{ width: 34, height: 34 }}>
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </div>
            <h2>Votre panier est vide</h2>
            <p>Parcourez le catalogue pour trouver des produits faits main par nos boutiques.</p>
            <button className="btn teal" onClick={() => navigate("/catalogue")}>
              Découvrir le catalogue
            </button>
          </div>
        ) : (
          <div className="layout">
            {/* ---------- Colonne articles ---------- */}
            <div className="items-col">
              {groupedByShop.map((group) => (
                <div className="panel" key={group.shopId}>
                  <div className="shop-group-head">
                    <span className="logo">
                      {group.shopLogo ? (
                        <img src={group.shopLogo} alt="" />
                      ) : (
                        group.shopName.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span
                      className="shop-name"
                      onClick={() => navigate(`/boutiques/${group.shopId}`)}
                    >
                      {group.shopName}
                    </span>
                    <span
                      className="visit"
                      onClick={() => navigate(`/boutiques/${group.shopId}`)}
                    >
                      Voir la boutique
                      <svg viewBox="0 0 24 24" className="icn" style={{ width: 13, height: 13 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>

                  {group.items.map((item) => (
                    <div className="item" key={item.id}>
                      <div className="thumb">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="item-body">
                        <div className="item-top">
                          <div>
                            <div
                              className="item-name"
                              onClick={() => navigate(`/produit/${item.productId}`)}
                            >
                              {item.name}
                            </div>
                            <div className="item-variant">{item.variant}</div>
                          </div>
                          <div className="item-price">
                            {item.isOnSale ? (
                              <>
                                <span className="item-price-sale">{item.displayPrice} DH</span>
                                <span className="item-price-original">{item.price} DH</span>
                              </>
                            ) : (
                              <>{item.displayPrice} DH</>
                            )}
                            <span className="unit">/ unité</span>
                          </div>
                        {item.isOnSale && (
                          <div className="sale-badge">
                            En solde{item.saleDiscountPercent > 0 ? ` -${item.saleDiscountPercent}%` : ''}
                            {item.saleEnd ? ` • jusqu'au ${new Date(item.saleEnd).toLocaleDateString('fr-FR')}` : ''}
                          </div>
                        )}
                        </div>

                        <div className="item-bottom">
                          <div className="qty">
                            <button onClick={() => handleQuantityChange(item, -1)} disabled={item.qty <= 1}>−</button>
                            <span>{item.qty}</span>
                            <button onClick={() => handleQuantityChange(item, 1)} disabled={item.qty >= item.stock}>+</button>
                          </div>

                          <div className="item-actions">
                            <button onClick={() => handleSaveForLater(item.id)}>
                              <svg viewBox="0 0 24 24" className="icn" style={{ width: 14, height: 14 }}>
                                <path d="M6 4h12v17l-6-4-6 4Z" />
                              </svg>
                              Enregistrer pour plus tard
                            </button>
                            <span className="sep"></span>
                            <button className="remove" onClick={() => handleRemoveItem(item.id)}>
                              <svg viewBox="0 0 24 24" className="icn" style={{ width: 14, height: 14 }}>
                                <polyline points="4 7 20 7" />
                                <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
                              </svg>
                              Retirer
                            </button>
                          </div>
                        </div>

                        {item.stock <= 3 && (
                          <div className="stock-warn">
                            <svg viewBox="0 0 24 24" className="icn" style={{ width: 13, height: 13 }}>
                              <path d="M12 9v4" />
                              <circle cx="12" cy="16.5" r=".5" />
                              <path d="M10.3 3.9 2 18a1.8 1.8 0 0 0 1.5 2.7h17a1.8 1.8 0 0 0 1.5-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
                            </svg>
                            Plus que {item.stock} en stock
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="panel-foot">
                    <button className="continue-link" onClick={() => navigate("/catalogue")}>
                      <svg viewBox="0 0 24 24" className="icn">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Continuer mes achats
                    </button>
                  </div>
                </div>
              ))}

              {savedItems.length > 0 && (
                <div className="saved-section">
                  <div className="saved-head">
                    <svg viewBox="0 0 24 24" className="icn">
                      <path d="M6 4h12v17l-6-4-6 4Z" />
                    </svg>
                    Enregistré pour plus tard ({savedItems.length})
                  </div>
                  <div className="saved-grid">
                    {savedItems.map((item) => (
                      <div className="saved-card" key={item.id}>
                        <div className="thumb">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="info">
                          <div className="name">{item.name}</div>
                          <div className="price">{item.price} DH</div>
                          <button className="add-back" onClick={() => handleRestoreItem(item.id)}>
                            Remettre au panier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ---------- Colonne résumé ---------- */}
            <div className="summary">
              <h2>Résumé de la commande</h2>

              <div className="summary-row">
                <span>Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})</span>
                <b>{subtotal} DH</b>
              </div>
              <div className="summary-row discount">
                <span>Réduction</span>
                <b>− {discount} DH</b>
              </div>
              <div className="summary-row">
                <span>Livraison estimée</span>
                <b>{shippingFee === 0 ? "Gratuite" : `${shippingFee} DH`}</b>
              </div>

              {promoApplied ? (
                <div className="promo-applied">
                  <span>Code « {promoApplied.code} » appliqué</span>
                  <button onClick={handleRemovePromo}>Retirer</button>
                </div>
              ) : (
                <div className="promo">
                  <input
                    type="text"
                    placeholder="Code promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button onClick={handleApplyPromo}>Appliquer</button>
                </div>
              )}

              <div className="summary-sep"></div>

              <div className="summary-total">
                <span className="label">Total</span>
                <span className="value">{total} DH</span>
              </div>
              <div className="tax-note">TVA incluse, hors frais éventuels de douane</div>

              <button className="btn teal" onClick={handleGoToShipping}>
                Continuer vers la livraison
              </button>

              <div className="note-field">
                <label>Note pour le vendeur (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Ex. Merci d'emballer avec soin…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="trust-row">
                <div className="t">
                  <svg viewBox="0 0 24 24" className="icn">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  Paiement sécurisé
                </div>
                <div className="t">
                  <svg viewBox="0 0 24 24" className="icn">
                    <path d="M12 3 4 6v6c0 4.5 3 7.7 8 9 5-1.3 8-4.5 8-9V6z" />
                  </svg>
                  Retour 14 jours
                </div>
                <div className="t">
                  <svg viewBox="0 0 24 24" className="icn">
                    <rect x="2" y="7" width="14" height="11" rx="1.5" />
                    <path d="M16 10h3.5l2.5 3v5H16z" />
                    <circle cx="7" cy="19.5" r="1.6" />
                    <circle cx="18" cy="19.5" r="1.6" />
                  </svg>
                  Suivi de livraison
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {checkoutOpen && <div className="checkout-overlay"><div className="checkout-card">
        <button className="checkout-close" onClick={() => setCheckoutOpen(false)}>×</button>
        <div className="checkout-progress"><span className="current">1</span><i></i><span className={checkoutStep === 2 ? "current" : ""}>2</span></div>
        {checkoutMessage && <div className="checkout-message">{checkoutMessage}</div>}
        {checkoutStep === 2 && paymentMethod === 'card' && (
          <div className="checkout-extra-fields">
            <input placeholder="MM/AA" value={card.expiry} onChange={(e)=>setCard({...card,expiry:e.target.value})} />
            <input placeholder="CVC" value={card.cvc} onChange={(e)=>setCard({...card,cvc:e.target.value})} />
          </div>
        )}
        {checkoutStep === 1 ? <><div className="checkout-card-head"><p>Étape 1 sur 2</p><h2>Livraison</h2><span>Votre adresse de réception.</span></div><div className="checkout-fields two-cols"><input placeholder="Prénom" value={delivery.prenom} onChange={(e)=>setDelivery({...delivery,prenom:e.target.value})}/><input placeholder="Nom" value={delivery.nom} onChange={(e)=>setDelivery({...delivery,nom:e.target.value})}/><input className="full" placeholder="Adresse complète" value={delivery.adresse} onChange={(e)=>setDelivery({...delivery,adresse:e.target.value})}/><input placeholder="Ville" value={delivery.ville} onChange={(e)=>setDelivery({...delivery,ville:e.target.value})}/><input placeholder="Code postal" value={delivery.codePostal} onChange={(e)=>setDelivery({...delivery,codePostal:e.target.value})}/><input className="full" placeholder="Téléphone" value={delivery.telephone} onChange={(e)=>setDelivery({...delivery,telephone:e.target.value})}/></div><div className="checkout-actions"><button className="checkout-back" onClick={()=>setCheckoutOpen(false)}>Retour</button><button className="btn teal" onClick={handleNextStep}>Suivant</button></div></> : <><div className="checkout-card-head"><p>Étape 2 sur 2</p><h2>Paiement</h2><span>Choisissez votre mode de paiement.</span></div><div className="payment-methods"><label className={paymentMethod === "card" ? "selected" : ""}><input type="radio" checked={paymentMethod === "card"} onChange={()=>setPaymentMethod("card")}/>Carte bancaire</label><label className={paymentMethod === "cash" ? "selected" : ""}><input type="radio" checked={paymentMethod === "cash"} onChange={()=>setPaymentMethod("cash")}/>Paiement à la livraison</label></div>{paymentMethod === "card" && <div className="checkout-fields"><input placeholder="Nom sur la carte" value={card.name} onChange={(e)=>setCard({...card,name:e.target.value})}/><input placeholder="Numéro de carte" value={card.number} onChange={(e)=>setCard({...card,number:e.target.value})}/></div>}<div className="checkout-total"><span>Total à payer</span><b>{total} DH</b></div><div className="checkout-actions"><button className="checkout-back" onClick={()=>setCheckoutStep(1)}>Précédent</button><button className="btn teal" disabled={isPlacing} onClick={handlePlaceOrder}>{isPlacing ? "Traitement…" : "Confirmer et payer"}</button></div></>}
      </div></div>}    </main>
  );
}

export default Panier;


