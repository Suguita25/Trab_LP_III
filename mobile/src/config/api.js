import { Platform } from "react-native";
import SourceCode from "react-native/Libraries/NativeModules/specs/NativeSourceCode";

const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "";
const AUTO_DETECT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_AUTO_DETECT !== "false";
const FALLBACK_API_BASE_URL =
  Platform.OS === "ios" ? "http://127.0.0.1:8000" : "http://10.0.2.2:8000";

function parseUrlSafely(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function getBundleUrl() {
  try {
    let scriptURL = SourceCode.getConstants().scriptURL;

    if (!scriptURL) {
      return null;
    }

    if (scriptURL.startsWith("/")) {
      scriptURL = `file://${scriptURL}`;
    }

    return parseUrlSafely(scriptURL)?.toString() || null;
  } catch {
    return null;
  }
}

function getLocalBackendHost(hostname) {
  if (!hostname) {
    return null;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return Platform.OS === "android" ? "10.0.2.2" : hostname;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return hostname;
  }

  return null;
}

function getAutomaticApiBaseUrl() {
  const bundleUrl = getBundleUrl();
  const parsedBundleUrl = bundleUrl ? parseUrlSafely(bundleUrl) : null;
  const host = getLocalBackendHost(parsedBundleUrl?.hostname);

  if (!host) {
    return null;
  }

  return `http://${host}:8000`;
}

const DEFAULT_API_BASE_URL = AUTO_DETECT_API_BASE_URL
  ? getAutomaticApiBaseUrl() || FALLBACK_API_BASE_URL
  : ENV_API_BASE_URL || FALLBACK_API_BASE_URL;

export function normalizeApiBaseUrl(value) {
  if (!value || !value.trim()) {
    return DEFAULT_API_BASE_URL;
  }

  return value.trim().replace(/\/+$/, "");
}

export function getInitialApiBaseUrl() {
  return normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
}
