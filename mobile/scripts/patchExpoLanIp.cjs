const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo",
  "node_modules",
  "@expo",
  "cli",
  "build",
  "src",
  "utils",
  "ip.js"
);

const patchedContent = `"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getIpAddress", {
    enumerable: true,
    get: function() {
        return getIpAddress;
    }
});
function _lannetwork() {
    const data = require("lan-network");
    _lannetwork = function() {
        return data;
    };
    return data;
}
function _os() {
    const data = require("os");
    _os = function() {
        return data;
    };
    return data;
}
function isPrivateIPv4(address) {
    return /^10\\./.test(address) || /^192\\.168\\./.test(address) || /^172\\.(1[6-9]|2\\d|3[01])\\./.test(address);
}
function getAddressPriority(interfaceName, address) {
    const normalizedName = (interfaceName || '').toLowerCase();
    let score = 0;
    if (/wi-?fi|wlan|wireless/.test(normalizedName)) {
        score += 500;
    }
    if (/ethernet|^eth/.test(normalizedName)) {
        score += 400;
    }
    if (/^192\\.168\\./.test(address)) {
        score += 300;
    } else if (/^10\\./.test(address)) {
        score += 250;
    } else if (/^172\\.(1[6-9]|2\\d|3[01])\\./.test(address)) {
        score += 150;
    }
    if (/wsl|hyper-v|vethernet|virtual|vmware|docker|loopback|pseudo|tailscale|zerotier|vpn/.test(normalizedName)) {
        score -= 1000;
    }
    return score;
}
function getNetworkInterfacesIp() {
    const interfaces = (0, _os().networkInterfaces)();
    const candidates = [];
    for (const [interfaceName, entries] of Object.entries(interfaces)){
        for (const entry of entries || []){
            if (!entry || entry.internal || entry.family !== 'IPv4' || !entry.address) {
                continue;
            }
            candidates.push({
                address: entry.address,
                score: getAddressPriority(interfaceName, entry.address)
            });
        }
    }
    candidates.sort((a, b)=>b.score - a.score);
    return candidates[0] ? candidates[0].address : null;
}
function getIpAddress() {
    try {
        const lan = (0, _lannetwork().lanNetworkSync)();
        const score = getAddressPriority(lan == null ? void 0 : lan.iname, lan == null ? void 0 : lan.address);
        if ((lan == null ? void 0 : lan.address) && lan.address !== '127.0.0.1' && score > 0) {
            return lan.address;
        }
    } catch  {}
    return getNetworkInterfacesIp() || '127.0.0.1';
}
`;

function patchFile() {
  if (!fs.existsSync(targetFile)) {
    console.warn(
      `[patchExpoLanIp] Arquivo nao encontrado: ${targetFile}`
    );
    process.exit(0);
  }

  const current = fs.readFileSync(targetFile, "utf8");

  if (current === patchedContent) {
    console.log("[patchExpoLanIp] Patch ja aplicado.");
    return;
  }

  fs.writeFileSync(targetFile, patchedContent, "utf8");
  console.log("[patchExpoLanIp] Patch aplicado em utils/ip.js.");
}

patchFile();
