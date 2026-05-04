import { StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";

const toneColors = {
  primary: {
    border: theme.colors.borderSoft,
    value: theme.colors.textStrong,
  },
  success: {
    border: "rgba(216, 243, 176, 0.24)",
    value: theme.colors.success,
  },
  warning: {
    border: theme.colors.borderSoft,
    value: theme.colors.warningDark,
  },
  default: {
    border: theme.colors.borderSoft,
    value: theme.colors.textStrong,
  },
};

export default function ProgressCard({ helper, label, tone = "default", value }) {
  const palette = toneColors[tone] || toneColors.default;

  return (
    <View style={[styles.card, { borderColor: palette.border }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: palette.value }]}>{value}</Text>
      <Text style={styles.helper}>{helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    gap: 8,
    padding: 18,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
  },
  helper: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
});
