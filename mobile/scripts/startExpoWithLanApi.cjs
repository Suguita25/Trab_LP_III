const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const BACKEND_PORT =
  process.env.EXPO_PUBLIC_API_PORT || process.env.BACKEND_PORT || "8000";

function isPrivateIPv4(address) {
  return (
    /^10\./.test(address) ||
    /^192\.168\./.test(address) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address)
  );
}

function getAddressPriority(interfaceName, address) {
  const normalizedName = (interfaceName || "").toLowerCase();
  let score = 0;

  if (/wi-?fi|wlan|wireless/.test(normalizedName)) {
    score += 600;
  }

  if (/ethernet|^eth/.test(normalizedName)) {
    score += 500;
  }

  if (/^192\.168\./.test(address)) {
    score += 400;
  } else if (/^10\./.test(address)) {
    score += 350;
  } else if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) {
    score += 300;
  }

  if (
    /wsl|hyper-v|vethernet|virtual|vmware|docker|loopback|pseudo|tailscale|zerotier|vpn|bluetooth/.test(
      normalizedName
    )
  ) {
    score -= 2000;
  }

  return score;
}

function getLanIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      if (
        !entry ||
        entry.internal ||
        entry.family !== "IPv4" ||
        !entry.address ||
        !isPrivateIPv4(entry.address)
      ) {
        continue;
      }

      candidates.push({
        address: entry.address,
        interfaceName,
        score: getAddressPriority(interfaceName, entry.address),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates[0] || null;
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (configuredUrl) {
    return {
      source: "EXPO_PUBLIC_API_BASE_URL",
      url: normalizeBaseUrl(configuredUrl),
    };
  }

  const configuredHost = process.env.EXPO_PUBLIC_API_HOST?.trim();

  if (configuredHost) {
    return {
      source: "EXPO_PUBLIC_API_HOST",
      url: `http://${configuredHost}:${BACKEND_PORT}`,
    };
  }

  const lan = getLanIpAddress();

  if (!lan) {
    return {
      source: "fallback",
      url: `http://127.0.0.1:${BACKEND_PORT}`,
    };
  }

  return {
    source: `${lan.interfaceName} (${lan.address})`,
    url: `http://${lan.address}:${BACKEND_PORT}`,
  };
}

function checkBackend(apiBaseUrl) {
  return new Promise((resolve) => {
    const request = http.get(`${apiBaseUrl}/healthcheck`, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 300);
    });

    request.setTimeout(2500, () => {
      request.destroy();
      resolve(false);
    });

    request.on("error", () => {
      resolve(false);
    });
  });
}

async function main() {
  const api = getApiBaseUrl();
  const backendReachable = await checkBackend(api.url);
  const expoCli = path.join(
    __dirname,
    "..",
    "node_modules",
    "expo",
    "bin",
    "cli"
  );
  const args = process.argv.slice(2);
  const hasConnectionMode = args.some((arg) =>
    ["--lan", "--localhost", "--tunnel"].includes(arg)
  );
  const expoArgs = [
    "start",
    ...(hasConnectionMode ? [] : ["--lan"]),
    ...args,
  ];

  console.log(`[mobile] Backend automatico: ${api.url}`);
  console.log(`[mobile] Origem do IP: ${api.source}`);

  if (!backendReachable) {
    console.warn(
      "[mobile] Aviso: nao consegui acessar /healthcheck nessa URL a partir deste computador."
    );
    console.warn(
      "[mobile] Confirme se o backend esta rodando e se a porta 8000 esta liberada no firewall."
    );
  }

  const child = spawn(process.execPath, [expoCli, ...expoArgs], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      EXPO_PUBLIC_API_BASE_URL: api.url,
      EXPO_PUBLIC_API_AUTO_DETECT: "false",
    },
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
