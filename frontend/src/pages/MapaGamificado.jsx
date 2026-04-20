import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import {
  getLocations,
  getUnlockedPoints,
  unlockLocation,
} from "../services/gamificationApi";
import "./MapaGamificado.css";


function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const raioTerra = 6371000;

  const toRad = (valor) => (valor * Math.PI) / 180;

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

function converterArquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Erro ao converter a imagem"));
  });
}

export default function MapaGamificado({ usuarioLogado }) {
  const [usuarioId, setUsuarioId] = useState(
    usuarioLogado?.id ? String(usuarioLogado.id) : ""
  );
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [unlockingPointId, setUnlockingPointId] = useState(null);
  const [pontosDesbloqueados, setPontosDesbloqueados] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (usuarioLogado?.id) {
      setUsuarioId(String(usuarioLogado.id));
    }
  }, [usuarioLogado]);

  useEffect(() => {
    async function carregarPontos() {
      try {
        setLoadingLocations(true);
        setError("");
        const data = await getLocations();
        setLocations(data);
      } catch (err) {
        console.error("erro ao carregar pontos:", err);
        setError(err.message || "Erro ao carregar pontos turísticos");
      } finally {
        setLoadingLocations(false);
      }
    }

    carregarPontos();
  }, []);

  useEffect(() => {
  async function carregarDesbloqueios() {
    if (!usuarioId.trim()) {
      setPontosDesbloqueados([]);
      return;
    }

    try {
      const data = await getUnlockedPoints(usuarioId);
      setPontosDesbloqueados(data.pontos_desbloqueados || []);
    } catch (err) {
      console.error("erro ao carregar desbloqueios:", err);
    }
  }

  carregarDesbloqueios();
}, [usuarioId]);

  function solicitarLocalizacao() {
    setLocationError("");
    setMessage("");
    setError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocalização não é suportada neste navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocationError("Não foi possível obter a localização do usuário.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function handleFileChange(pontoId, event) {
    const file = event.target.files?.[0] || null;

    setSelectedFiles((prev) => ({
      ...prev,
      [pontoId]: file,
    }));
  }

  const locationsComDistancia = useMemo(() => {
    return locations.map((location) => {
      if (!userLocation) {
        return {
          ...location,
          distanciaCalculada: null,
          dentroDoRaio: false,
        };
      }

      const distancia = calcularDistanciaMetros(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );

      return {
        ...location,
        distanciaCalculada: distancia,
        dentroDoRaio: distancia <= location.raio_desbloqueio,
      };
    });
  }, [locations, userLocation]);

  const centroMapa = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }

    if (locations.length > 0) {
      return [locations[0].latitude, locations[0].longitude];
    }

    return [-22.9519, -43.2105];
  }, [userLocation, locations]);

  async function handleUnlock(location) {
    try {
      setMessage("");
      setError("");

      if (!usuarioId.trim()) {
        setError("Informe o ID do usuário para testar o desbloqueio.");
        return;
      }

      if (!userLocation) {
        setError("Obtenha a localização do usuário antes de desbloquear.");
        return;
      }

      const file = selectedFiles[location.id];

      if (!file) {
        setError("Selecione uma foto para desbloquear este ponto.");
        return;
      }

      setUnlockingPointId(location.id);

      const fotoBase64 = await converterArquivoParaBase64(file);

      const payload = {
        foto: fotoBase64,
        origem_foto: "camera",
        latitude_usuario: userLocation.latitude,
        longitude_usuario: userLocation.longitude,
      };

      const response = await unlockLocation(usuarioId, location.id, payload);

      setPontosDesbloqueados((prev) =>
        prev.includes(location.id) ? prev : [...prev, location.id]
      );

      setMessage(
        `${response.mensagem} Pontos ganhos: ${response.pontos_ganhos}. Pontos totais: ${response.pontos_totais_usuario}.`
      );

      setSelectedFiles((prev) => ({
        ...prev,
        [location.id]: null,
      }));
    } catch (err) {
      if (
        err.message &&
        err.message.includes("ja foi desbloqueado por este usuario")
      ) {
        setPontosDesbloqueados((prev) =>
          prev.includes(location.id) ? prev : [...prev, location.id]
        );
      }

      console.error("erro ao desbloquear ponto:", err);
      setError(err.message || "Erro ao desbloquear ponto turístico.");
    } finally {
      setUnlockingPointId(null);
    }
  }

  return (
    <div className="mapa-gamificado">
      <div className="mapa-gamificado__header">
        <h1>Mapa Gamificado</h1>
        <p>
          Explore pontos turísticos, valide sua localização e desbloqueie
          conquistas com foto.
        </p>
      </div>

      <section className="mapa-gamificado__painel">
        <div className="mapa-gamificado__campo">
          <label htmlFor="usuarioId">ID do usuário</label>
          <input
            id="usuarioId"
            type="number"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Ex.: 1"
          />
        </div>

        <button
          type="button"
          className="mapa-gamificado__botao"
          onClick={solicitarLocalizacao}
        >
          Obter minha localização
        </button>

        {userLocation && (
          <div className="mapa-gamificado__status">
            <strong>Localização atual:</strong>{" "}
            {userLocation.latitude.toFixed(6)},{" "}
            {userLocation.longitude.toFixed(6)}
          </div>
        )}

        {locationError && (
          <div className="mapa-gamificado__mensagem mapa-gamificado__mensagem--erro">
            {locationError}
          </div>
        )}

        {message && (
          <div className="mapa-gamificado__mensagem mapa-gamificado__mensagem--sucesso">
            {message}
          </div>
        )}

        {error && (
          <div className="mapa-gamificado__mensagem mapa-gamificado__mensagem--erro">
            {error}
          </div>
        )}
      </section>

      <section className="mapa-gamificado__lista">
        <div className="mapa-gamificado__secao-titulo">
          <h2>Mapa dos pontos</h2>
          <span>{locations.length} ponto(s)</span>
        </div>

        <div className="mapa-gamificado__mapa-wrapper">
          <MapContainer
            center={centroMapa}
            zoom={13}
            scrollWheelZoom={true}
            className="mapa-gamificado__mapa"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {locationsComDistancia.map((location) => (
              <CircleMarker
                key={location.id}
                center={[location.latitude, location.longitude]}
                radius={10}
                pathOptions={{
                  color: pontosDesbloqueados.includes(location.id)
                    ? "#4ade80"
                    : location.dentroDoRaio
                    ? "#d8f3b0"
                    : "#dcbd6b",
                  fillColor: pontosDesbloqueados.includes(location.id)
                    ? "#4ade80"
                    : location.dentroDoRaio
                    ? "#d8f3b0"
                    : "#dcbd6b",
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <strong>{location.nome}</strong>
                  <br />
                  {location.descricao || "Sem descrição."}
                  <br />
                  Pontos: {location.pontos_valor}
                  <br />
                  Raio: {location.raio_desbloqueio} m
                  <br />
                  Status:{" "}
                  {pontosDesbloqueados.includes(location.id)
                    ? "Desbloqueado"
                    : location.dentroDoRaio
                    ? "No raio"
                    : "Bloqueado"}
                  <br />
                  Distância:{" "}
                  {location.distanciaCalculada === null
                    ? "obtenha a localização"
                    : `${location.distanciaCalculada.toFixed(2)} m`}
                </Popup>
              </CircleMarker>
            ))}

            {userLocation && (
              <CircleMarker
                center={[userLocation.latitude, userLocation.longitude]}
                radius={12}
                pathOptions={{
                  color: "#4da3ff",
                  fillColor: "#4da3ff",
                  fillOpacity: 0.95,
                }}
              >
                <Popup>Você está aqui</Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>
      </section>

      <section className="mapa-gamificado__lista">
        <div className="mapa-gamificado__secao-titulo">
          <h2>Pontos turísticos</h2>
          <span>{locations.length} ponto(s)</span>
        </div>

        {loadingLocations ? (
          <div className="mapa-gamificado__vazio">Carregando pontos...</div>
        ) : locationsComDistancia.length === 0 ? (
          <div className="mapa-gamificado__vazio">
            Nenhum ponto turístico encontrado.
          </div>
        ) : (
          <div className="mapa-gamificado__grid">
            {locationsComDistancia.map((location) => (
              <article
                key={location.id}
                className={`mapa-gamificado__card ${
                  pontosDesbloqueados.includes(location.id)
                    ? "mapa-gamificado__card--desbloqueado"
                    : ""
                }`}
              >
                <div className="mapa-gamificado__card-topo">
                  <div>
                    <h3>{location.nome}</h3>
                    <p>{location.descricao || "Sem descrição."}</p>
                  </div>

                  <span
                    className={`mapa-gamificado__badge ${
                      pontosDesbloqueados.includes(location.id)
                        ? "mapa-gamificado__badge--desbloqueado"
                        : location.dentroDoRaio
                        ? "mapa-gamificado__badge--ativo"
                        : ""
                    }`}
                  >
                    {pontosDesbloqueados.includes(location.id)
                      ? "Desbloqueado"
                      : location.dentroDoRaio
                      ? "No raio"
                      : "Bloqueado"}
                  </span>
                </div>

                <div className="mapa-gamificado__info">
                  <span>
                    <strong>Latitude:</strong> {location.latitude}
                  </span>
                  <span>
                    <strong>Longitude:</strong> {location.longitude}
                  </span>
                  <span>
                    <strong>Raio:</strong> {location.raio_desbloqueio} m
                  </span>
                  <span>
                    <strong>Pontos:</strong> {location.pontos_valor}
                  </span>
                  <span>
                    <strong>Distância:</strong>{" "}
                    {location.distanciaCalculada === null
                      ? "obtenha a localização"
                      : `${location.distanciaCalculada.toFixed(2)} m`}
                  </span>
                </div>

                <div className="mapa-gamificado__acoes">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => handleFileChange(location.id, event)}
                  />

                  <button
                    type="button"
                    className="mapa-gamificado__botao"
                    onClick={() => handleUnlock(location)}
                    disabled={unlockingPointId === location.id}
                  >
                    {unlockingPointId === location.id
                      ? "Desbloqueando..."
                      : "Desbloquear ponto"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}