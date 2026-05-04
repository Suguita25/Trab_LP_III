import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";
import {
  formatarDistancia,
  getStatusLabel,
} from "../utils/gamification";

function getBadgeAppearance(status) {
  if (status === "desbloqueado") {
    return {
      backgroundColor: theme.colors.successMuted,
      borderColor: "rgba(216, 243, 176, 0.28)",
      color: theme.colors.successBright,
    };
  }

  if (status === "no_raio") {
    return {
      backgroundColor: theme.colors.warningMuted,
      borderColor: theme.colors.borderSoft,
      color: theme.colors.textStrong,
    };
  }

  return {
    backgroundColor: theme.colors.dangerMuted,
    borderColor: "rgba(255, 155, 155, 0.22)",
    color: theme.colors.danger,
  };
}

export default function PointListCard({ distance, onPress, point, status }) {
  const badgeAppearance = getBadgeAppearance(status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{point.nome}</Text>
          <Text numberOfLines={2} style={styles.description}>
            {point.descricao || "Sem descricao cadastrada."}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            badgeAppearance,
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeAppearance.color }]}>
            {getStatusLabel(status)}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <Text style={styles.metaText}>Pontos: {point.pontos_valor}</Text>
        <Text style={styles.metaText}>
          Raio: {Math.round(point.raio_desbloqueio)} m
        </Text>
        <Text style={styles.metaText}>
          Distancia: {formatarDistancia(distance)}
        </Text>
      </View>

      <Text style={styles.actionText}>Abrir detalhe do ponto</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: theme.colors.textStrong,
    fontSize: 17,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  metaGrid: {
    gap: 6,
  },
  metaText: {
    color: theme.colors.primarySoft,
    fontSize: 13,
    fontWeight: "600",
  },
  actionText: {
    color: theme.colors.textStrong,
    fontSize: 13,
    fontWeight: "800",
  },
});
