const API_BASE_URL = "http://localhost:8000";


export async function getLocations() {
  const response = await fetch(`${API_BASE_URL}/locations`);

  if (!response.ok) {
    throw new Error("Erro ao buscar pontos turísticos");
  }

  return response.json();
}

export async function unlockLocation(usuarioId, pontoId, payload) {
  const response = await fetch(
    `${API_BASE_URL}/usuarios/${usuarioId}/desbloqueios/${pontoId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erro ao desbloquear ponto turístico");
  }

  return data;
}

export async function getUnlockedPoints(usuarioId) {
  const response = await fetch(
    `${API_BASE_URL}/usuarios/${usuarioId}/desbloqueios`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erro ao buscar desbloqueios do usuário");
  }

  return data;
}