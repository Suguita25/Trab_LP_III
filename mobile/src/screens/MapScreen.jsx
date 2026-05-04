import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Callout, Marker } from "react-native-maps";
import PointDetailModal from "../components/PointDetailModal";
import PointListCard from "../components/PointListCard";
import { useAppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import {
  calcularDistanciaMetros,
  formatarDistancia,
  getStatusColor,
  getStatusLabel,
  getStatusPonto,
} from "../utils/gamification";
import { obterLocalizacaoAtual } from "../utils/location";

const DEFAULT_REGION = {
  latitude: -22.9519,
  longitude: -43.2105,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const {
    carregandoDados,
    locations,
    pontosDesbloqueados,
    sincronizarGamificacao,
    ultimaConquista,
    userLocation,
    setUserLocation,
    usuario,
  } = useAppContext();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationFeedback, setLocationFeedback] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    let active = true;

    async function carregarDadosIniciais() {
      if (!usuario?.id) {
        return;
      }

      try {
        await sincronizarGamificacao(usuario.id);
      } catch (error) {
        if (active) {
          setLocationError(
            error.message || "Nao foi possivel carregar os pontos agora."
          );
        }
      }
    }

    carregarDadosIniciais();

    return () => {
      active = false;
    };
  }, [usuario?.id]);

  async function handleSyncData() {
    setLocationError("");
    setLocationFeedback("");

    if (usuario?.id) {
      try {
        await sincronizarGamificacao(usuario.id);
        setLocationFeedback("Mapa atualizado.");
      } catch (error) {
        setLocationError(
          error.message || "Nao foi possivel atualizar o mapa agora."
        );
      }
    }
  }

  const pontosComStatus = useMemo(() => {
    return locations.map((point) => {
      const unlocked = pontosDesbloqueados.includes(point.id);
      const distance = userLocation
        ? calcularDistanciaMetros(
            userLocation.latitude,
            userLocation.longitude,
            point.latitude,
            point.longitude
          )
        : null;
      const status = getStatusPonto(point, userLocation, pontosDesbloqueados);

      return {
        ...point,
        unlocked,
        distance,
        status,
      };
    });
  }, [locations, pontosDesbloqueados, userLocation]);

  const mapRegion = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };
    }

    if (locations.length > 0) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    return DEFAULT_REGION;
  }, [locations, userLocation]);

  async function handleRefreshLocation() {
    setLocationError("");
    setLocationFeedback("");
    setUpdatingLocation(true);

    try {
      const coords = await obterLocalizacaoAtual();
      setUserLocation(coords);
      setLocationFeedback(
        `Localizacao atual: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
      );
    } catch (error) {
      setLocationError(
        error.message || "Nao foi possivel obter sua localizacao."
      );
    } finally {
      setUpdatingLocation(false);
    }
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.brand}>Exerion</Text>
            <Text style={styles.eyebrow}>MAPA GAMIFICADO</Text>
            <Text style={styles.heroTitle}>Mapa gamificado de exploracao</Text>
            <Text style={styles.heroSubtitle}>
              Visualize os locais, valide sua proximidade e registre visitas com
              foto para desbloquear conquistas.
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              onPress={handleRefreshLocation}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              {updatingLocation ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>Atualizar localizacao</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleSyncData}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Atualizar mapa</Text>
            </Pressable>
          </View>
        </View>

        {locationFeedback ? (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{locationFeedback}</Text>
          </View>
        ) : null}

        {locationError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        ) : null}

        {ultimaConquista ? (
          <View style={styles.achievementBox}>
            <Text style={styles.achievementTitle}>Ultimo desbloqueio</Text>
            <Text style={styles.achievementText}>
              {ultimaConquista.ponto_nome} renderam {ultimaConquista.pontos_ganhos} pontos.
            </Text>
            <Text style={styles.achievementText}>
              Pontos totais do usuario: {ultimaConquista.pontos_totais_usuario}
            </Text>
          </View>
        ) : null}

        <View style={styles.mapCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mapa dos pontos</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionMeta}>{locations.length} ponto(s)</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.colors.success }]}
              />
              <Text style={styles.legendLabel}>Desbloqueado</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.colors.primary }]}
              />
              <Text style={styles.legendLabel}>No raio</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.colors.warning }]}
              />
              <Text style={styles.legendLabel}>Bloqueado</Text>
            </View>
          </View>

          {carregandoDados && locations.length === 0 ? (
            <View style={styles.emptyMap}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.emptyMapText}>Carregando pontos turisticos...</Text>
            </View>
          ) : (
            <MapView
              initialRegion={mapRegion}
              region={mapRegion}
              style={styles.map}
            >
              {pontosComStatus.map((point) => (
                <Marker
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }}
                  key={point.id}
                  onPress={() => setSelectedPoint(point)}
                  pinColor={getStatusColor(point.status)}
                  title={point.nome}
                >
                  <Callout onPress={() => setSelectedPoint(point)}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>{point.nome}</Text>
                      <Text style={styles.calloutText}>
                        Status: {getStatusLabel(point.status)}
                      </Text>
                      <Text style={styles.calloutText}>
                        Distancia: {formatarDistancia(point.distance)}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}

              {userLocation ? (
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  pinColor={theme.colors.accent}
                  title="Sua localizacao"
                />
              ) : null}
            </MapView>
          )}
        </View>

        <View style={styles.listPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pontos turisticos</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionMeta}>Toque para ver detalhes</Text>
            </View>
          </View>

          {pontosComStatus.length === 0 && !carregandoDados ? (
            <View style={styles.emptyListCard}>
              <Text style={styles.emptyListTitle}>Nenhum ponto encontrado</Text>
              <Text style={styles.emptyListText}>
                Ainda nao ha locais disponiveis para exploracao neste momento.
              </Text>
            </View>
          ) : null}

          {pontosComStatus.map((point) => (
            <PointListCard
              distance={point.distance}
              key={point.id}
              onPress={() => setSelectedPoint(point)}
              point={point}
              status={point.status}
            />
          ))}
        </View>
      </ScrollView>

      <PointDetailModal
        onClose={() => setSelectedPoint(null)}
        point={selectedPoint}
        visible={Boolean(selectedPoint)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    gap: 18,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  heroTextBlock: {
    gap: 8,
  },
  brand: {
    color: theme.colors.textStrong,
    fontSize: 28,
    fontWeight: "800",
  },
  eyebrow: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: theme.colors.textStrong,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroSubtitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: theme.colors.primaryContrast,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  secondaryButtonPressed: {
    opacity: 0.82,
  },
  secondaryButtonText: {
    color: theme.colors.textStrong,
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackBox: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 14,
  },
  feedbackText: {
    color: theme.colors.primaryDark,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerMuted,
    borderColor: "rgba(255, 155, 155, 0.22)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 14,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  achievementBox: {
    backgroundColor: theme.colors.successMuted,
    borderColor: "rgba(216, 243, 176, 0.25)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  achievementTitle: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  achievementText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  mapCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    gap: 14,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.colors.textStrong,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionBadge: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionMeta: {
    color: theme.colors.textStrong,
    fontSize: 12,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  legendLabel: {
    color: theme.colors.text,
    fontSize: 12,
  },
  emptyMap: {
    alignItems: "center",
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 280,
  },
  emptyMapText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  map: {
    borderRadius: theme.radius.lg,
    height: 320,
  },
  callout: {
    gap: 4,
    maxWidth: 220,
    paddingVertical: 6,
  },
  calloutTitle: {
    color: theme.colors.textStrong,
    fontSize: 14,
    fontWeight: "800",
  },
  calloutText: {
    color: theme.colors.text,
    fontSize: 12,
  },
  listPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    gap: 12,
    padding: 16,
  },
  emptyListCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  emptyListTitle: {
    color: theme.colors.textStrong,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyListText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
});
