import { requestJson } from "./apiClient";

export function listarMatchesUsuario(baseUrl, usuarioId) {
  return requestJson(baseUrl, `/usuarios/${usuarioId}/matches`);
}

export function buscarDetalhesMatchUsuario(baseUrl, usuarioId, outroUsuarioId) {
  return requestJson(
    baseUrl,
    `/usuarios/${usuarioId}/matches/${outroUsuarioId}`
  );
}

export function curtirMatchUsuario(baseUrl, usuarioId, outroUsuarioId) {
  return requestJson(
    baseUrl,
    `/usuarios/${usuarioId}/matches/${outroUsuarioId}/curtir`,
    {
      method: "POST",
    }
  );
}

export function ignorarMatchUsuario(baseUrl, usuarioId, outroUsuarioId) {
  return requestJson(
    baseUrl,
    `/usuarios/${usuarioId}/matches/${outroUsuarioId}/ignorar`,
    {
      method: "POST",
    }
  );
}

export function listarInteracoesMatchUsuario(baseUrl, usuarioId) {
  return requestJson(baseUrl, `/usuarios/${usuarioId}/matches/interacoes`);
}
