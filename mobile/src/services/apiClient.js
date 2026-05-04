import { normalizeApiBaseUrl } from "../config/api";

function buildUrl(baseUrl, path) {
  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function parseResponseBody(response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

export async function requestJson(baseUrl, path, options = {}) {
  let response;

  try {
    response = await fetch(buildUrl(baseUrl, path), {
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      "Nao foi possivel conectar ao servidor. Verifique sua rede e tente novamente."
    );
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const detail =
      data && typeof data === "object"
        ? data.detail || data.message
        : data;

    throw new Error(detail || `Requisicao falhou (${response.status})`);
  }

  return data;
}
