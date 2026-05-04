import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import {
  unlockLocation,
  validarProximidade,
} from "../services/gamificationApi";
import { theme } from "../styles/theme";
import {
  buildPhotoDataUri,
  formatarDistancia,
  getStatusLabel,
  getStatusPonto,
} from "../utils/gamification";
import { selecionarImagemComPermissao } from "../utils/imagePicker";
import { obterLocalizacaoAtual } from "../utils/location";

export default function PointDetailModal({ point, visible, onClose }) {
  const {
    apiBaseUrl,
    pontosDesbloqueados,
    registrarDesbloqueioLocal,
    setUserLocation,
    sincronizarGamificacao,
    userLocation,
    usuario,
  } = useAppContext();
  const [validation, setValidation] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const statusAtual = point
    ? getStatusPonto(point, userLocation, pontosDesbloqueados)
    : "bloqueado";
  const desbloqueado = point ? pontosDesbloqueados.includes(point.id) : false;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setValidation(null);
    setSelectedPhoto(null);
    setFeedback("");
    setError("");
  }, [point?.id, visible]);

  if (!point) {
    return null;
  }

  async function handleValidateProximity() {
    setFeedback("");
    setError("");
    setValidating(true);

    try {
      const coords = await obterLocalizacaoAtual();
      setUserLocation(coords);

      const response = await validarProximidade(apiBaseUrl, usuario.id, point.id, {
        latitude_usuario: coords.latitude,
        longitude_usuario: coords.longitude,
      });

      const result = {
        ...response,
        latitude_usuario: coords.latitude,
        longitude_usuario: coords.longitude,
      };

      setValidation(result);

      if (result.dentro_do_raio) {
        setFeedback(
          `Localizacao validada. Distancia atual: ${formatarDistancia(result.distancia)}.`
        );
      } else {
        setError(
          `Voce ainda esta fora do raio. Distancia atual: ${formatarDistancia(
            result.distancia
          )}.`
        );
      }
    } catch (validationError) {
      setError(
        validationError.message ||
          "Nao foi possivel validar a proximidade deste ponto."
      );
    } finally {
      setValidating(false);
    }
  }

  async function handlePickPhoto(origin) {
    setFeedback("");
    setError("");
    setLoadingPhoto(true);

    try {
      const result = await selecionarImagemComPermissao(origin, {
        cameraDeniedMessage:
          "Permita o acesso a camera para registrar a visita.",
        galleryDeniedMessage:
          "Permita o acesso a galeria para anexar a visita.",
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.base64) {
        throw new Error("Nao foi possivel preparar a foto para envio.");
      }

      setSelectedPhoto({
        base64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
        origin,
        uri: asset.uri,
      });

      setFeedback(
        origin === "camera"
          ? "Foto capturada. Agora voce ja pode registrar a visita."
          : "Foto selecionada. Agora voce ja pode registrar a visita."
      );
    } catch (photoError) {
      setError(photoError.message || "Nao foi possivel carregar a foto.");
    } finally {
      setLoadingPhoto(false);
    }
  }

  async function handleRegisterVisit() {
    setFeedback("");
    setError("");

    if (desbloqueado) {
      setFeedback("Este ponto ja foi desbloqueado anteriormente.");
      return;
    }

    if (!validation?.dentro_do_raio) {
      setError("Valide a proximidade antes de registrar a visita.");
      return;
    }

    if (!selectedPhoto) {
      setError("Selecione uma foto do local antes de registrar a visita.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        foto: buildPhotoDataUri(selectedPhoto.base64, selectedPhoto.mimeType),
        origem_foto: selectedPhoto.origin,
        latitude_usuario: validation.latitude_usuario,
        longitude_usuario: validation.longitude_usuario,
      };

      const response = await unlockLocation(
        apiBaseUrl,
        usuario.id,
        point.id,
        payload
      );

      registrarDesbloqueioLocal(point.id, response);
      await sincronizarGamificacao(usuario.id, apiBaseUrl);

      setFeedback(
        `${response.mensagem} +${response.pontos_ganhos} pontos para sua conta.`
      );
    } catch (unlockError) {
      setError(
        unlockError.message || "Nao foi possivel registrar a visita agora."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.header}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.eyebrow}>Exerion</Text>
              <Text style={styles.title}>{point.nome}</Text>
              <Text style={styles.subtitle}>Status: {getStatusLabel(statusAtual)}</Text>
            </View>

            <Pressable hitSlop={10} onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Detalhes do ponto</Text>
              <Text style={styles.infoText}>Descricao: {point.descricao || "Sem descricao."}</Text>
              <Text style={styles.infoText}>Categoria: Ponto turistico</Text>
              <Text style={styles.infoText}>Pontos: {point.pontos_valor}</Text>
              <Text style={styles.infoText}>
                Raio de desbloqueio: {Math.round(point.raio_desbloqueio)} m
              </Text>
              <Text style={styles.infoText}>
                Coordenadas: {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Etapa 1: validar proximidade</Text>
              <Text style={styles.infoText}>
                Use sua localizacao atual para confirmar se voce esta dentro do
                raio permitido deste local.
              </Text>

              <Pressable
                disabled={validating}
                onPress={handleValidateProximity}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  validating && styles.disabledButton,
                ]}
              >
                {validating ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>Validar proximidade</Text>
                )}
              </Pressable>

              {validation ? (
                <View
                  style={[
                    styles.validationCard,
                    validation.dentro_do_raio
                      ? styles.validationCardSuccess
                      : styles.validationCardWarning,
                  ]}
                >
                  <Text style={styles.validationText}>
                    Distancia atual: {formatarDistancia(validation.distancia)}
                  </Text>
                  <Text style={styles.validationText}>
                    Resultado:{" "}
                    {validation.dentro_do_raio
                      ? "Dentro do raio, pronto para registrar."
                      : "Fora do raio, aproxime-se mais do local."}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Etapa 2: anexar foto</Text>
              <View style={styles.actionRow}>
                <Pressable
                  disabled={loadingPhoto}
                  onPress={() => handlePickPhoto("camera")}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Usar camera</Text>
                </Pressable>

                <Pressable
                  disabled={loadingPhoto}
                  onPress={() => handlePickPhoto("galeria")}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Abrir galeria</Text>
                </Pressable>
              </View>

              {loadingPhoto ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : null}

              {selectedPhoto ? (
                <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} />
              ) : null}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Etapa 3: registrar visita</Text>
              <Text style={styles.infoText}>
                Sua visita sera registrada com foto e localizacao para liberar
                o ponto no seu progresso.
              </Text>

              <Pressable
                disabled={submitting || desbloqueado}
                onPress={handleRegisterVisit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  (submitting || desbloqueado) && styles.disabledButton,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {desbloqueado ? "Ponto ja desbloqueado" : "Registrar visita"}
                  </Text>
                )}
              </Pressable>
            </View>

            {feedback ? (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: theme.colors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.sidebar,
    borderColor: theme.colors.border,
    borderTopWidth: 2,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "92%",
    minHeight: "72%",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: 16,
    width: 56,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  headerTextBlock: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  eyebrow: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.textStrong,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  closeButton: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: theme.colors.textStrong,
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 28,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  infoTitle: {
    color: theme.colors.textStrong,
    fontSize: 16,
    fontWeight: "800",
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButtonPressed: {
    opacity: 0.9,
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
    minHeight: 46,
    paddingHorizontal: 12,
  },
  secondaryButtonPressed: {
    opacity: 0.86,
  },
  secondaryButtonText: {
    color: theme.colors.textStrong,
    fontSize: 13,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  validationCard: {
    borderRadius: theme.radius.md,
    gap: 6,
    padding: 12,
  },
  validationCardSuccess: {
    backgroundColor: theme.colors.successMuted,
    borderColor: "rgba(216, 243, 176, 0.25)",
    borderWidth: 1,
  },
  validationCardWarning: {
    backgroundColor: theme.colors.warningMuted,
    borderColor: theme.colors.borderSoft,
    borderWidth: 1,
  },
  validationText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  previewImage: {
    borderColor: theme.colors.borderSoft,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    height: 220,
    width: "100%",
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
});
