import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressCard from "../components/ProgressCard";
import { useAppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import { calcularPercentualExploracao } from "../utils/gamification";

export default function ProgressScreen() {
  const {
    carregandoDados,
    locations,
    pontosDesbloqueados,
    sincronizarGamificacao,
    ultimaConquista,
    usuario,
  } = useAppContext();
  const [syncFeedback, setSyncFeedback] = useState("");
  const [syncError, setSyncError] = useState("");

  const totalLocais = locations.length;
  const locaisDesbloqueados = pontosDesbloqueados.length;
  const totalPontosPossiveis = locations.reduce(
    (sum, point) => sum + (point.pontos_valor || 0),
    0
  );
  const percentualExploracao = calcularPercentualExploracao(
    totalLocais,
    locaisDesbloqueados
  );
  const pontosPendentes = Math.max(
    totalPontosPossiveis - (usuario?.pontos_totais || 0),
    0
  );
  const desbloqueadosDetalhados = locations.filter((point) =>
    pontosDesbloqueados.includes(point.id)
  );

  async function handleRefreshProgress() {
    setSyncFeedback("");
    setSyncError("");

    try {
      await sincronizarGamificacao(usuario?.id);
      setSyncFeedback("Progresso atualizado com sucesso.");
    } catch (error) {
      setSyncError(
        error.message || "Nao foi possivel atualizar o progresso agora."
      );
    }
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroBrand}>Exerion</Text>
          <Text style={styles.heroEyebrow}>PROGRESSO</Text>
          <Text style={styles.heroTitle}>Resumo da exploracao</Text>
          <Text style={styles.heroSubtitle}>
            Acompanhe quantos pontos ja foram visitados, quanto ainda falta e a
            pontuacao acumulada ao longo da sua jornada.
          </Text>
        </View>

        <View style={styles.cardsGrid}>
          <ProgressCard
            helper={`${percentualExploracao}% do mapa concluido`}
            label="Pontos desbloqueados"
            tone="success"
            value={`${locaisDesbloqueados}/${totalLocais || 0}`}
          />
          <ProgressCard
            helper="Pontuacao acumulada nas visitas registradas"
            label="Pontuacao total"
            tone="primary"
            value={String(usuario?.pontos_totais || 0)}
          />
          <ProgressCard
            helper="Potencial restante de exploracao no mapa"
            label="Pontos restantes"
            tone="warning"
            value={String(pontosPendentes)}
          />
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Barra de exploracao</Text>
            <Text style={styles.progressValue}>{percentualExploracao}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentualExploracao}%` },
              ]}
            />
          </View>

          <Text style={styles.progressHint}>
            Total possivel no mapa: {totalPontosPossiveis} pontos.
          </Text>

          <Pressable
            onPress={handleRefreshProgress}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshButtonPressed,
            ]}
          >
            <Text style={styles.refreshButtonText}>
              {carregandoDados ? "Sincronizando..." : "Atualizar progresso"}
            </Text>
          </Pressable>
        </View>

        {syncFeedback ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>{syncFeedback}</Text>
          </View>
        ) : null}

        {syncError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        ) : null}

        {ultimaConquista ? (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>Ultima conquista registrada</Text>
            <Text style={styles.highlightText}>
              {ultimaConquista.ponto_nome} gerou {ultimaConquista.pontos_ganhos} pontos.
            </Text>
            {ultimaConquista.badge ? (
              <Text style={styles.highlightText}>
                Badge recebida: {ultimaConquista.badge}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Locais visitados</Text>

          {desbloqueadosDetalhados.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma visita registrada ainda. Volte ao mapa e desbloqueie um
              ponto para iniciar seu progresso.
            </Text>
          ) : (
            desbloqueadosDetalhados.map((point) => (
              <View key={point.id} style={styles.locationRow}>
                <View style={styles.locationTextBlock}>
                  <Text style={styles.locationName}>{point.nome}</Text>
                  <Text style={styles.locationMeta}>
                    +{point.pontos_valor} pontos | raio {Math.round(point.raio_desbloqueio)} m
                  </Text>
                </View>
                <View style={styles.locationBadge}>
                  <Text style={styles.locationBadgeText}>Visitado</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    gap: 8,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  heroBrand: {
    color: theme.colors.textStrong,
    fontSize: 28,
    fontWeight: "800",
  },
  heroEyebrow: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: theme.colors.textStrong,
    fontSize: 26,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  cardsGrid: {
    gap: 12,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    gap: 16,
    padding: 18,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.colors.textStrong,
    fontSize: 18,
    fontWeight: "800",
  },
  progressValue: {
    color: theme.colors.textStrong,
    fontSize: 16,
    fontWeight: "800",
  },
  progressTrack: {
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: 999,
    height: 14,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    height: "100%",
  },
  progressHint: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  refreshButtonPressed: {
    opacity: 0.9,
  },
  refreshButtonText: {
    color: theme.colors.primaryContrast,
    fontSize: 14,
    fontWeight: "800",
  },
  feedbackCard: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  feedbackText: {
    color: theme.colors.primaryDark,
    fontSize: 13,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: theme.colors.dangerMuted,
    borderColor: "rgba(255, 155, 155, 0.22)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  highlightCard: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  highlightTitle: {
    color: theme.colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  highlightText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    gap: 14,
    padding: 18,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  locationRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  locationTextBlock: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  locationName: {
    color: theme.colors.textStrong,
    fontSize: 15,
    fontWeight: "800",
  },
  locationMeta: {
    color: theme.colors.text,
    fontSize: 12,
  },
  locationBadge: {
    backgroundColor: theme.colors.successMuted,
    borderColor: "rgba(216, 243, 176, 0.25)",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBadgeText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: "800",
  },
});
