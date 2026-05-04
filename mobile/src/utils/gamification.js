export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const raioTerra = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return raioTerra * c;
}

export function getStatusPonto(point, userLocation, pontosDesbloqueados) {
  if (pontosDesbloqueados.includes(point.id)) {
    return "desbloqueado";
  }

  if (!userLocation) {
    return "bloqueado";
  }

  const distance = calcularDistanciaMetros(
    userLocation.latitude,
    userLocation.longitude,
    point.latitude,
    point.longitude
  );

  return distance <= point.raio_desbloqueio ? "no_raio" : "bloqueado";
}

export function getStatusLabel(status) {
  if (status === "desbloqueado") {
    return "Desbloqueado";
  }

  if (status === "no_raio") {
    return "No raio";
  }

  return "Bloqueado";
}

export function getStatusColor(status) {
  if (status === "desbloqueado") {
    return "#2D8A55";
  }

  if (status === "no_raio") {
    return "#0E6F6F";
  }

  return "#C08A11";
}

export function formatarDistancia(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "localizacao nao validada";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} km`;
  }

  return `${value.toFixed(0)} m`;
}

export function buildPhotoDataUri(base64, mimeType) {
  return `data:${mimeType || "image/jpeg"};base64,${base64}`;
}

export function calcularPercentualExploracao(totalLocais, locaisDesbloqueados) {
  if (!totalLocais) {
    return 0;
  }

  return Math.round((locaisDesbloqueados / totalLocais) * 100);
}
