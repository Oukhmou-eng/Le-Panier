const API_URL = 'http://localhost:3000';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getPanier() {
  const response = await fetch(`${API_URL}/panier`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible de récupérer le panier.');
  }
  return data?.items ?? [];
}

export async function getPanierEnregistres() {
  const response = await fetch(`${API_URL}/panier/enregistres`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible de récupérer les articles enregistrés.');
  }
  return data?.items ?? [];
}

export async function addToPanier(id_produit, quantite = 1) {
  const response = await fetch(`${API_URL}/panier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ id_produit, quantite }),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible d ajouter l article au panier.');
  }
  return data;
}

export async function updatePanierQuantity(id, quantite) {
  const response = await fetch(`${API_URL}/panier/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ quantite }),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible de mettre à jour la quantité.');
  }
  return data;
}

export async function removeFromPanier(id) {
  const response = await fetch(`${API_URL}/panier/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible de supprimer l article du panier.');
  }
  return data;
}

export async function saveForLater(id) {
  const response = await fetch(`${API_URL}/panier/${id}/enregistrer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible d exécuter l opération.');
  }
  return data;
}

export async function restoreFromSaved(id) {
  const response = await fetch(`${API_URL}/panier/${id}/restaurer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible d exécuter l opération.');
  }
  return data;
}

export async function placeOrder(payload) {
  const response = await fetch(`${API_URL}/commandes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible de passer la commande.');
  }
  return data;
}