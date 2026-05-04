import { requestJson } from "./apiClient";

export function loginUsuario(baseUrl, payload) {
  return requestJson(baseUrl, "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function cadastrarUsuario(baseUrl, payload) {
  return requestJson(baseUrl, "/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function buscarUsuarioPorEmail(baseUrl, email) {
  return requestJson(
    baseUrl,
    `/usuarios/email/${encodeURIComponent(email)}`
  );
}

export function buscarUsuarioPorId(baseUrl, usuarioId) {
  return requestJson(baseUrl, `/usuarios/${usuarioId}`);
}
