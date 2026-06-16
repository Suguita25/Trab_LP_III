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
  const url = buildUrl(baseUrl, path);

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      `Nao foi possivel conectar ao servidor em ${url}. Verifique o IP, a porta e a rede Wi-Fi.`
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
