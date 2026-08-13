import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../css/PublierProduit.css';

const MAX_VIDEOS = 1;
const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('token');
const id_boutique = localStorage.getItem('id_boutique');

const initialForm = {
  nom: '',
  categorie: '',
  prix: '',
  stock: '',
  description: '',
  optionsPaiement: '',
};

function PublierProduit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productStatus, setProductStatus] = useState('en_ligne');

  const title = id ? 'Modifier le produit' : 'Publier un produit';

  // Un seul tableau, ordre = ordre d'affichage. media[0] = couverture (image OU vidéo).
  // Chaque élément : { file: File|null, url: string (aperçu), type: 'image' | 'video', existing?: boolean }
  const [media, setMedia] = useState([]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  useEffect(() => {
    const normalizeCategories = (data) => {
      if (!Array.isArray(data)) return [];
      return data.map((cat) => {
        if (typeof cat === 'string') {
          return { id: String(cat), label: cat };
        }
        const categoryId = cat.id ?? cat.id_categorie ?? cat.label ?? cat.nom ?? JSON.stringify(cat);
        return {
          id: String(categoryId),
          label: cat.label ?? cat.nom ?? String(cat),
        };
      });
    };

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Impossible de charger les catégories.');
        const data = await response.json();
        setCategories(normalizeCategories(data));
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setIsEditing(true);
      setLoadingProduct(true);
      try {
        const response = await fetch(`${API_URL}/produits/${id}`);
        if (!response.ok) throw new Error('Impossible de charger le produit.');
        const product = await response.json();
        setForm({
          nom: product.nom || '',
          categorie: product.id_categorie ? String(product.id_categorie) : product.categorie_nom || product.categorie || '',
          prix: product.prix ?? '',
          stock: product.stock ?? '',
          description: product.description || '',
          optionsPaiement: '',
        });
        setProductStatus(product.statut || 'en_ligne');
        setMedia((product.medias ?? []).map((item) => ({ url: item.url, type: item.type, file: null, existing: true })));
      } catch (loadError) {
        console.error('Erreur de chargement du produit :', loadError);
        setError(loadError.message || 'Impossible de charger le produit.');
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    let videoTotal = media.filter((item) => item.type === 'video').length;
    let refusedVideos = 0;
    const accepted = [];
    files.forEach((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      if (type === 'video' && videoTotal >= MAX_VIDEOS) {
        refusedVideos += 1;
        return;
      }
      if (type === 'video') videoTotal += 1;
      accepted.push({ file, url: URL.createObjectURL(file), type });
    });
    if (accepted.length) setMedia((current) => [...current, ...accepted]);
    setError(refusedVideos ? `Une seule vidéo est autorisée. ${refusedVideos} vidéo(s) n’ont pas été ajoutée(s).` : '');
    event.target.value = '';
  };

  const setAsCover = (index) => {
    setMedia((current) => {
      const next = [...current];
      const [selected] = next.splice(index, 1);
      return [selected, ...next];
    });
  };

  const removeMedia = (index) => {
    setMedia((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const submit = async (event, statut = 'en_ligne') => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const hasFiles = media.some((item) => item.file instanceof File);
      const url = id ? `${API_URL}/produits/${id}` : `${API_URL}/produits`;
      const method = id ? 'PATCH' : 'POST';
      let response;

      if (id && !hasFiles) {
        const body = {
          ...form,
          statut: statut || productStatus,
        };
        response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } else {
        const payload = new FormData();
        Object.entries(form).forEach(([name, value]) => {
          if (name !== 'optionsPaiement') payload.append(name, value);
        });
        payload.append('statut', statut || productStatus);
        media.forEach((item) => {
          if (item.file instanceof File) payload.append('medias', item.file);
        });
        response = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: payload,
        });
      }

      const data = await response.json();
      if (!response.ok) {
        const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
        throw new Error(message || 'Impossible d’enregistrer le produit.');
      }
      media.forEach((item) => { if (item.file instanceof File) URL.revokeObjectURL(item.url); });
      setMedia(media.filter((item) => item.existing));
      setForm(initialForm);
      if (id) navigate('/mes-produits');
    } catch (requestError) {
      setError(requestError.message || 'Impossible d’enregistrer le produit. Réessayez dans un instant.');
    } finally {
      setSubmitting(false);
    }
  };
  const videoCount = media.filter((item) => item.type === 'video').length;

  if (id && loadingProduct) {
    return (
      <main className="content-area">
        <div className="topline">
          <div>
            <span className="kicker">Chargement</span>
            <h1>{title}</h1>
          </div>
        </div>
        <div className="form-card">Chargement du produit en cours…</div>
      </main>
    );
  }

  return (
    <main className="content-area">
      <div className="topline">
        <div>
          <span className="kicker">{id ? 'Modification' : 'Nouveau'}</span>
          <h1>{title}</h1>
        </div>
      </div>

      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          {/* ---- Colonne gauche : infos produit ---- */}
          <div className="form-col">
            <div className="field">
              <label>Nom du produit</label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={updateField}
                placeholder="Ex: Tapis berbère en laine"
                  required
              />
            </div>

            <div className="field">
              <label>Catégorie</label>
              <select name="categorie" value={form.categorie} onChange={updateField} required>
                <option value="">Choisir une catégorie</option>
                {categories.map((categorie) => (
                  <option value={categorie.id} key={categorie.id}>
                    {categorie.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Prix (MAD)</label>
                <input
                  type="number"
                  name="prix"
                  value={form.prix}
                  onChange={updateField}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="field">
                <label>Stock disponible</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={updateField}
                  min="0"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            {isEditing && (
              <div className="field">
                <label>Statut du produit</label>
                <select value={productStatus} onChange={(event) => setProductStatus(event.target.value)}>
                  <option value="en_ligne">En ligne</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="rupture">Hors stock</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>
            )}

            <div className="field">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Décrivez votre produit en quelques mots…"
              />
            </div>

            <div className="field">
              <label>Options de paiement spécifiques</label>
              <select name="optionsPaiement" value={form.optionsPaiement} onChange={updateField}>
                <option value="">Utiliser les paramètres par défaut de la boutique</option>
                <option value="online_only">Paiement 100% en ligne obligatoire</option>
                <option value="deposit">Acompte + Livraison autorisé</option>
                <option value="cod">Paiement à la livraison uniquement</option>
              </select>
              <p className="field-hint">Laissez par défaut pour appliquer vos réglages généraux de boutique.</p>
            </div>
          </div>

          {/* ---- Colonne droite : médias du produit ---- */}
          <div className="form-col">
            <div className="field">
              <label>Photos et vidéo du produit</label>

              <label className="dropzone">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFilesSelected}
                  className="dropzone-input"
                />
                <span className="dropzone-icon">🖼️</span>
                <span className="dropzone-title">Ajouter des photos ou une vidéo</span>
                <span className="dropzone-hint">
                  Cliquez ou glissez-déposez — PNG, JPG jusqu'à 5 Mo · {MAX_VIDEOS} vidéo max ({videoCount}/{MAX_VIDEOS})
                </span>
              </label>

              {error && (
                <p className="form-message form-message--error" role="alert">
                  {error}
                </p>
              )}

              {media.length > 0 && (
                <ul className="media-grid">
                  {media.map((item, index) => (
                    <li className={`media-thumb ${index === 0 ? 'is-cover' : ''}`} key={item.url}>
                      {item.type === 'video' ? (
                        <video src={item.url} controls />
                      ) : (
                        <img src={item.url} alt={`Aperçu ${index + 1}`} />
                      )}

                      {item.type === 'video' && <span className="media-thumb-tag">Vidéo</span>}

                      {index === 0 ? (
                        <span className="media-thumb-badge">★ Principale</span>
                      ) : (
                        <button
                          type="button"
                          className="media-thumb-btn media-thumb-btn--cover"
                          onClick={() => setAsCover(index)}
                          title="Définir comme média principal"
                        >
                          ★
                        </button>
                      )}

                      <button
                        type="button"
                        className="media-thumb-btn media-thumb-btn--remove"
                        onClick={() => removeMedia(index)}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn outline" type="button" disabled={submitting} onClick={(event) => submit(event, 'brouillon')}>
            Enregistrer en brouillon
          </button>
          <button className="btn teal" type="submit" disabled={submitting}>
            {submitting ? 'Publication…' : 'Publier le produit ✓'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default PublierProduit;