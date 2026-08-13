const API_URL = 'http://localhost:3000';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCommandesUtilisateur(userId = 1) {
  const response = await fetch(`${API_URL}/commandes/utilisateur/${userId}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await response.json();

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new Error(message || 'Impossible de récupérer les commandes.');
  }

  return data?.commandes ?? [];
}