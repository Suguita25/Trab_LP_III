import { requestJson } from "./apiClient";

export function getLocations(baseUrl) {
  return requestJson(baseUrl, "/locations");
}

export function getUnlockedPoints(baseUrl, usuarioId) {
  return requestJson(baseUrl, `/usuarios/${usuarioId}/desbloqueios`);
}

export function validarProximidade(baseUrl, usuarioId, pontoId, payload) {
  return requestJson(
    baseUrl,
    `/usuarios/${usuarioId}/desbloqueios/${pontoId}/validar-proximidade`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
}

export function unlockLocation(baseUrl, usuarioId, pontoId, payload) {
  return requestJson(
    baseUrl,
    `/usuarios/${usuarioId}/desbloqueios/${pontoId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
}
