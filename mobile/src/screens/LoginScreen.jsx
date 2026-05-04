import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import { buildPhotoDataUri } from "../utils/gamification";
import { selecionarImagemComPermissao } from "../utils/imagePicker";

export default function LoginScreen() {
  const { apiBaseUrl, autenticando, cadastrando, cadastrar, login } =
    useAppContext();
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [fotoVerificacao, setFotoVerificacao] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSelecionarFoto(origin) {
    setError("");
    setFeedback("");

    try {
      const result = await selecionarImagemComPermissao(origin, {
        cameraDeniedMessage:
          "Permita o acesso a camera para enviar sua foto de verificacao.",
        galleryDeniedMessage:
          "Permita o acesso a galeria para enviar sua foto de verificacao.",
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.base64) {
        throw new Error("Nao foi possivel preparar a foto para o cadastro.");
      }

      setFotoVerificacao({
        base64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
        origem: origin,
        uri: asset.uri,
      });
      setFeedback(
        origin === "camera"
          ? "Foto de verificacao capturada com sucesso."
          : "Foto de verificacao selecionada com sucesso."
      );
    } catch (photoError) {
      setError(photoError.message || "Nao foi possivel carregar a foto.");
    }
  }

  async function handleLogin() {
    setError("");
    setFeedback("");

    if (!email.trim() || !senha.trim()) {
      setError("Informe email e senha para continuar.");
      return;
    }

    try {
      const resposta = await login({
        baseUrl: apiBaseUrl,
        email: email.trim(),
        senha,
      });

      setFeedback(resposta?.mensagem || "Login realizado com sucesso.");
    } catch (loginError) {
      setError(loginError.message || "Nao foi possivel entrar no app.");
    }
  }

  async function handleCadastro() {
    setError("");
    setFeedback("");

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setError("Preencha nome, email e senha para criar sua conta.");
      return;
    }

    if (!fotoVerificacao) {
      setError(
        "Envie uma foto de verificacao usando a camera ou a galeria para concluir o cadastro."
      );
      return;
    }

    try {
      await cadastrar({
        baseUrl: apiBaseUrl,
        nome: nome.trim(),
        email: email.trim(),
        senha,
        fotoVerificacao: buildPhotoDataUri(
          fotoVerificacao.base64,
          fotoVerificacao.mimeType
        ),
        origemFoto: fotoVerificacao.origem,
      });

      setModo("login");
      setSenha("");
      setFeedback(
        "Cadastro realizado com sucesso. Sua foto de verificacao foi enviada para analise. Faca seu login."
      );
    } catch (registerError) {
      setError(registerError.message || "Nao foi possivel concluir o cadastro.");
    }
  }

  function handleTrocarModo(nextModo) {
    setModo(nextModo);
    setFeedback("");
    setError("");
  }

  const emCadastro = modo === "cadastro";
  const processando = emCadastro ? cadastrando : autenticando;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundGlowTop} />
      <View pointerEvents="none" style={styles.backgroundGlowBottom} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}></Text>
            <Text style={styles.brand}>Exerion</Text>
            <View style={styles.brandLine} />
            <Text style={styles.title}>Explore. Valide. Desbloqueie.</Text>
            <Text style={styles.subtitle}>
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.modeTabs}>
              <Pressable
                onPress={() => handleTrocarModo("login")}
                style={[
                  styles.modeTab,
                  !emCadastro && styles.modeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    !emCadastro && styles.modeTabTextActive,
                  ]}
                >
                  Entrar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTrocarModo("cadastro")}
                style={[
                  styles.modeTab,
                  emCadastro && styles.modeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    emCadastro && styles.modeTabTextActive,
                  ]}
                >
                  Cadastrar
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionEyebrow}>
              {emCadastro ? "Novo acesso" : "Acesso"}
            </Text>
            <Text style={styles.sectionTitle}>
              {emCadastro ? "Criar sua conta" : "Entrar na sua conta"}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {emCadastro
                ? "Cadastre seus dados e envie uma foto de verificacao para entrar no universo Exerion."
                : "Use um usuario ja cadastrado para acessar o mapa gamificado."}
            </Text>

            {emCadastro ? (
              <View style={styles.field}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  onChangeText={setNome}
                  placeholder="Digite seu nome"
                  placeholderTextColor={theme.colors.placeholder}
                  style={styles.input}
                  value={nome}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="usuario@exemplo.com"
                placeholderTextColor={theme.colors.placeholder}
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                onChangeText={setSenha}
                placeholder="Sua senha"
                placeholderTextColor={theme.colors.placeholder}
                secureTextEntry
                style={styles.input}
                value={senha}
              />
            </View>

            {emCadastro ? (
              <View style={styles.verificationCard}>
                <Text style={styles.verificationTitle}>Foto de verificacao</Text>
                <Text style={styles.verificationText}>
                  Envie uma foto sua usando a camera ou a galeria para concluir
                  o cadastro.
                </Text>

                <View style={styles.verificationActions}>
                  <Pressable
                    disabled={processando}
                    onPress={() => handleSelecionarFoto("camera")}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.secondaryButtonPressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>Usar camera</Text>
                  </Pressable>

                  <Pressable
                    disabled={processando}
                    onPress={() => handleSelecionarFoto("galeria")}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.secondaryButtonPressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>Abrir galeria</Text>
                  </Pressable>
                </View>

                {fotoVerificacao ? (
                  <View style={styles.previewCard}>
                    <Image
                      source={{ uri: fotoVerificacao.uri }}
                      style={styles.previewImage}
                    />
                    <View style={styles.previewMeta}>
                      <Text style={styles.previewBadge}>Foto pronta</Text>
                      <Text style={styles.previewText}>
                        Origem:{" "}
                        {fotoVerificacao.origem === "camera"
                          ? "Camera"
                          : "Galeria"}
                      </Text>
                      <Text style={styles.previewText}>
                        Sua verificacao sera enviada junto com o cadastro.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Pressable
              disabled={processando}
              onPress={emCadastro ? handleCadastro : handleLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                processando && styles.primaryButtonDisabled,
              ]}
            >
              {processando ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {emCadastro ? "Criar conta" : "Entrar no mapa"}
                </Text>
              )}
            </Pressable>

            <Text style={styles.helperText}>
              {emCadastro
                ? "Depois do cadastro, voce pode fazer login e acompanhar seus pontos, progresso e visitas com foto."
                : "Sua conta acompanha pontos desbloqueados, progresso e visitas com foto."}
            </Text>

            {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  backgroundGlowTop: {
    backgroundColor: "rgba(220, 189, 107, 0.08)",
    borderRadius: 220,
    height: 320,
    position: "absolute",
    right: -90,
    top: -80,
    width: 320,
  },
  backgroundGlowBottom: {
    backgroundColor: "rgba(24, 67, 52, 0.9)",
    borderRadius: 260,
    bottom: -150,
    height: 360,
    left: -120,
    position: "absolute",
    width: 360,
  },
  content: {
    flexGrow: 1,
    gap: 22,
    justifyContent: "center",
    padding: 20,
  },
  heroBlock: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  eyebrow: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  brand: {
    color: theme.colors.textStrong,
    fontSize: 50,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  brandLine: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    height: 3,
    width: 84,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.primarySoft,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 340,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    gap: 18,
    padding: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  modeTabs: {
    backgroundColor: "rgba(1, 43, 27, 0.48)",
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 6,
  },
  modeTab: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modeTabActive: {
    backgroundColor: theme.colors.primary,
  },
  modeTabText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  modeTabTextActive: {
    color: theme.colors.primaryContrast,
  },
  sectionEyebrow: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: theme.colors.textStrong,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: -8,
  },
  field: {
    gap: 8,
  },
  label: {
    color: theme.colors.textStrong,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: theme.colors.input,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    color: theme.colors.textStrong,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  verificationCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  verificationTitle: {
    color: theme.colors.textStrong,
    fontSize: 15,
    fontWeight: "800",
  },
  verificationText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  verificationActions: {
    flexDirection: "row",
    gap: 10,
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
  previewCard: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  previewImage: {
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 96,
    width: 76,
  },
  previewMeta: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  previewBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.successMuted,
    borderColor: "rgba(216, 243, 176, 0.25)",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.success,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewText: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: theme.colors.primaryContrast,
    fontSize: 15,
    fontWeight: "800",
  },
  helperText: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  successText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
});
