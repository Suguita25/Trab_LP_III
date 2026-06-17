import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../context/AppContext";
import {
  buscarDetalhesMatchUsuario,
  curtirMatchUsuario,
  ignorarMatchUsuario,
  listarInteracoesMatchUsuario,
  listarMatchesUsuario,
} from "../services/matchApi";
import { theme } from "../styles/theme";

function formatarStatus(status) {
  if (status === "curtido") return "Curtido";
  if (status === "ignorado") return "Ignorado";
  return "Sugerido";
}

function formatarData(data) {
  if (!data) return "Agora mesmo";

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponivel";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarScore(score) {
  return `${Number(score || 0).toFixed(2)}%`;
}

function resumirLocais(locais) {
  if (!locais?.length) return "Nenhum local em comum ainda.";

  return locais.slice(0, 3).join(", ");
}

function obterFotosDoMatch(match) {
  return (match?.fotos_locais_em_comum || []).filter(
    (fotoLocal) => fotoLocal.foto_usuario_destino
  );
}

function obterFotosPublicadasDoMatch(match) {
  return (match?.fotos_usuario_destino || []).filter((foto) => foto.foto);
}

function obterFotosPreviewDoMatch(match) {
  const fotosPublicadas = obterFotosPublicadasDoMatch(match).map((foto) => ({
    id: `publicada-${foto.id}`,
    src: foto.foto,
  }));

  if (fotosPublicadas.length > 0) {
    return fotosPublicadas;
  }

  return obterFotosDoMatch(match).map((fotoLocal) => ({
    id: `local-${fotoLocal.ponto_id}`,
    src: fotoLocal.foto_usuario_destino,
  }));
}

function ResponsivePhoto({
  fallbackAspectRatio = 4 / 3,
  imageStyle,
  uri,
  wrapperStyle,
}) {
  const [aspectRatio, setAspectRatio] = useState(fallbackAspectRatio);

  useEffect(() => {
    let active = true;

    if (!uri) {
      setAspectRatio(fallbackAspectRatio);
      return undefined;
    }

    Image.getSize(
      uri,
      (width, height) => {
        if (!active || !width || !height) {
          return;
        }

        setAspectRatio(width / height);
      },
      () => {
        if (active) {
          setAspectRatio(fallbackAspectRatio);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [fallbackAspectRatio, uri]);

  return (
    <View style={[styles.responsivePhotoFrame, wrapperStyle]}>
      <Image
        resizeMode="contain"
        source={{ uri }}
        style={[
          styles.responsivePhoto,
          {
            aspectRatio,
          },
          imageStyle,
        ]}
      />
    </View>
  );
}

function PhotoStrip({ match }) {
  const fotos = obterFotosPreviewDoMatch(match).slice(0, 3);

  if (fotos.length === 0) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.photoStripContent}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.photoStrip}
    >
      {fotos.map((foto) => (
        <ResponsivePhoto
          fallbackAspectRatio={1}
          imageStyle={styles.previewImage}
          key={foto.id}
          uri={foto.src}
          wrapperStyle={styles.previewImageFrame}
        />
      ))}
    </ScrollView>
  );
}

function MatchCard({
  match,
  onAction,
  onSelect,
  processingActionId,
  selected,
}) {
  const processando = processingActionId === match.usuario_destino_id;

  return (
    <View style={[styles.matchCard, selected && styles.matchCardActive]}>
      <Pressable
        onPress={onSelect}
        style={({ pressed }) => [
          styles.matchCardButton,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.matchHeader}>
          <View style={styles.matchTitleBlock}>
            <Text style={styles.matchName}>{match.usuario_destino_nome}</Text>
            <Text style={styles.matchMeta}>
              {match.quantidade_locais_em_comum} locais em comum
            </Text>
          </View>

          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>
              {formatarScore(match.score_afinidade)}
            </Text>
          </View>
        </View>

        <Text style={styles.summaryText}>
          Locais: {resumirLocais(match.locais_em_comum)}
        </Text>

        <PhotoStrip match={match} />
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable
          disabled={processando}
          onPress={() => onAction(match.usuario_destino_id, "curtir")}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.flexButton,
            pressed && styles.primaryButtonPressed,
            processando && styles.disabledButton,
          ]}
        >
          {processando ? (
            <ActivityIndicator color={theme.colors.primaryContrast} />
          ) : (
            <Text style={styles.primaryButtonText}>Curtir</Text>
          )}
        </Pressable>

        <Pressable
          disabled={processando}
          onPress={() => onAction(match.usuario_destino_id, "ignorar")}
          style={({ pressed }) => [
            styles.secondaryButton,
            styles.flexButton,
            pressed && styles.secondaryButtonPressed,
            processando && styles.disabledButton,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Ignorar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DetailMetric({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FotosPublicadasDetalhe({ match }) {
  const fotos = obterFotosPublicadasDoMatch(match);

  if (fotos.length === 0) {
    return null;
  }

  return (
    <View style={styles.photoSection}>
      <Text style={styles.detailSectionTitle}>
        Fotos de {match.usuario_destino_nome}
      </Text>

      <View style={styles.photoGrid}>
        {fotos.map((foto) => (
          <View key={foto.id} style={styles.photoCard}>
            <ResponsivePhoto
              imageStyle={styles.photoCardImage}
              uri={foto.foto}
            />
            <View style={styles.photoCardTextBlock}>
              <Text style={styles.photoCardTitle}>Foto publicada</Text>
              <Text style={styles.photoCardMeta}>
                {formatarData(foto.data_postagem)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FotosLocaisDetalhe({ match }) {
  const fotos = obterFotosDoMatch(match);

  if (fotos.length === 0) {
    return null;
  }

  return (
    <View style={styles.photoSection}>
      <Text style={styles.detailSectionTitle}>Fotos nos pontos em comum</Text>

      <View style={styles.commonPhotoList}>
        {fotos.map((fotoLocal) => (
          <View key={fotoLocal.ponto_id} style={styles.commonPhotoCard}>
            <ResponsivePhoto
              imageStyle={styles.commonPhotoImage}
              uri={fotoLocal.foto_usuario_destino}
            />
            <View style={styles.photoCardTextBlock}>
              <Text style={styles.photoCardTitle}>
                {fotoLocal.ponto_nome}
              </Text>
              <Text style={styles.photoCardMeta}>
                {match.usuario_destino_nome} esteve aqui em{" "}
                {formatarData(fotoLocal.data_usuario_destino)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function HistoricoCard({ interacao }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchTitleBlock}>
          <Text style={styles.matchName}>{interacao.usuario_destino_nome}</Text>
          <Text style={styles.matchMeta}>
            {interacao.quantidade_locais_em_comum} locais em comum
          </Text>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{formatarStatus(interacao.status)}</Text>
        </View>
      </View>

      <Text style={styles.summaryText}>
        Afinidade de {formatarScore(interacao.score_afinidade)} em{" "}
        {formatarData(interacao.atualizado_em)}
      </Text>
      <Text style={styles.summaryText}>
        Locais: {resumirLocais(interacao.locais_em_comum)}
      </Text>

      <PhotoStrip match={interacao} />
    </View>
  );
}

export default function MatchesScreen() {
  const { apiBaseUrl, usuario } = useAppContext();
  const scrollViewRef = useRef(null);
  const detalhesPanelY = useRef(0);
  const [matches, setMatches] = useState([]);
  const [interacoes, setInteracoes] = useState([]);
  const [matchSelecionadoId, setMatchSelecionadoId] = useState(null);
  const [detalhesMatch, setDetalhesMatch] = useState(null);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [processandoAcaoId, setProcessandoAcaoId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function carregarDados() {
    if (!usuario?.id) {
      setMatches([]);
      setInteracoes([]);
      setMatchSelecionadoId(null);
      setDetalhesMatch(null);
      setCarregandoLista(false);
      return;
    }

    try {
      setCarregandoLista(true);
      setFeedback("");
      setError("");

      const [matchesCarregados, interacoesCarregadas] = await Promise.all([
        listarMatchesUsuario(apiBaseUrl, usuario.id),
        listarInteracoesMatchUsuario(apiBaseUrl, usuario.id),
      ]);

      setMatches(matchesCarregados);
      setInteracoes(interacoesCarregadas);
      setMatchSelecionadoId((current) => {
        const currentAindaExiste = matchesCarregados.some(
          (match) => match.usuario_destino_id === current
        );

        if (currentAindaExiste) {
          return current;
        }

        return matchesCarregados[0]?.usuario_destino_id || null;
      });

      if (matchesCarregados.length === 0) {
        setDetalhesMatch(null);
      }

      return true;
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar recomendacoes.");
      return false;
    } finally {
      setCarregandoLista(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [apiBaseUrl, usuario?.id]);

  useEffect(() => {
    let active = true;

    async function carregarDetalhes() {
      if (!usuario?.id || !matchSelecionadoId) {
        setDetalhesMatch(null);
        return;
      }

      try {
        setCarregandoDetalhes(true);
        setError("");

        const detalhes = await buscarDetalhesMatchUsuario(
          apiBaseUrl,
          usuario.id,
          matchSelecionadoId
        );

        if (active) {
          setDetalhesMatch(detalhes);
        }
      } catch (detailError) {
        if (active) {
          setError(detailError.message || "Erro ao carregar detalhes do match.");
        }
      } finally {
        if (active) {
          setCarregandoDetalhes(false);
        }
      }
    }

    carregarDetalhes();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, matchSelecionadoId, usuario?.id]);

  async function handleAtualizar() {
    const atualizou = await carregarDados();

    if (atualizou) {
      setFeedback("Afinidades atualizadas.");
    }
  }

  async function handleAcao(outroUsuarioId, acao) {
    if (!usuario?.id) return;

    try {
      setProcessandoAcaoId(outroUsuarioId);
      setFeedback("");
      setError("");

      const resposta =
        acao === "curtir"
          ? await curtirMatchUsuario(apiBaseUrl, usuario.id, outroUsuarioId)
          : await ignorarMatchUsuario(apiBaseUrl, usuario.id, outroUsuarioId);

      const matchAtualizado = resposta.match;
      const proximosMatches = matches.filter(
        (match) => match.usuario_destino_id !== outroUsuarioId
      );

      setMatches(proximosMatches);
      setInteracoes((atuais) => [
        matchAtualizado,
        ...atuais.filter(
          (interacao) => interacao.usuario_destino_id !== outroUsuarioId
        ),
      ]);
      setFeedback(resposta.mensagem || "Interacao registrada com sucesso.");

      if (matchSelecionadoId === outroUsuarioId) {
        setMatchSelecionadoId(
          proximosMatches[0]?.usuario_destino_id || null
        );

        if (proximosMatches.length === 0) {
          setDetalhesMatch(null);
        }
      }
    } catch (actionError) {
      setError(actionError.message || "Erro ao registrar interacao.");
    } finally {
      setProcessandoAcaoId(null);
    }
  }

  function handleSelecionarMatch(outroUsuarioId) {
    setMatchSelecionadoId(outroUsuarioId);

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        animated: true,
        y: Math.max(detalhesPanelY.current - 12, 0),
      });
    });
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroBrand}>Exerion</Text>
            <Text style={styles.heroEyebrow}>MATCH POR AFINIDADE</Text>
            <Text style={styles.heroTitle}>Pessoas com rotas parecidas</Text>
            <Text style={styles.heroSubtitle}>
              Veja usuarios que passaram pelos mesmos pontos e compare as fotos
              registradas nesses locais.
            </Text>
          </View>

          <Pressable
            disabled={carregandoLista}
            onPress={handleAtualizar}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              carregandoLista && styles.disabledButton,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {carregandoLista ? "Atualizando..." : "Atualizar afinidades"}
            </Text>
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{matches.length}</Text>
            <Text style={styles.statLabel}>Sugestoes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{interacoes.length}</Text>
            <Text style={styles.statLabel}>Interacoes</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recomendacoes</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionMeta}>{matches.length} ativa(s)</Text>
            </View>
          </View>

          {carregandoLista ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.emptyText}>Carregando matches...</Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma recomendacao agora</Text>
              <Text style={styles.emptyText}>
                Desbloqueie mais pontos para aumentar as chances de encontrar
                usuarios com trajetos parecidos.
              </Text>
            </View>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.usuario_destino_id}
                match={match}
                onAction={handleAcao}
                onSelect={() => handleSelecionarMatch(match.usuario_destino_id)}
                processingActionId={processandoAcaoId}
                selected={match.usuario_destino_id === matchSelecionadoId}
              />
            ))
          )}
        </View>

        <View
          onLayout={(event) => {
            detalhesPanelY.current = event.nativeEvent.layout.y;
          }}
          style={styles.panel}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detalhes da afinidade</Text>
            {detalhesMatch ? (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionMeta}>
                  {formatarStatus(detalhesMatch.status)}
                </Text>
              </View>
            ) : null}
          </View>

          {!matchSelecionadoId ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Selecione uma recomendacao para visualizar a compatibilidade.
              </Text>
            </View>
          ) : carregandoDetalhes ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.emptyText}>Carregando detalhes...</Text>
            </View>
          ) : !detalhesMatch ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Nao foi possivel carregar esse match.
              </Text>
            </View>
          ) : (
            <View style={styles.detailContent}>
              <View style={styles.detailSummary}>
                <Text style={styles.detailName}>
                  {detalhesMatch.usuario_destino_nome}
                </Text>
                <Text style={styles.detailText}>
                  {detalhesMatch.quantidade_locais_em_comum} locais em comum e{" "}
                  {formatarScore(detalhesMatch.score_afinidade)} de afinidade.
                </Text>
              </View>

              <View style={styles.metricsGrid}>
                <DetailMetric
                  label="Seus locais"
                  value={detalhesMatch.total_locais_usuario_origem}
                />
                <DetailMetric
                  label="Locais do match"
                  value={detalhesMatch.total_locais_usuario_destino}
                />
                <DetailMetric
                  label="Em comum"
                  value={detalhesMatch.quantidade_locais_em_comum}
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Locais em comum</Text>

                {detalhesMatch.locais_em_comum.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {detalhesMatch.locais_em_comum.map((local) => (
                      <View key={local} style={styles.tag}>
                        <Text style={styles.tagText}>{local}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.detailText}>
                    Nenhum local compartilhado ate o momento.
                  </Text>
                )}
              </View>

              <FotosPublicadasDetalhe match={detalhesMatch} />
              <FotosLocaisDetalhe match={detalhesMatch} />

              <View style={styles.actionRow}>
                <Pressable
                  disabled={
                    processandoAcaoId === detalhesMatch.usuario_destino_id
                  }
                  onPress={() =>
                    handleAcao(detalhesMatch.usuario_destino_id, "curtir")
                  }
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.flexButton,
                    pressed && styles.primaryButtonPressed,
                    processandoAcaoId === detalhesMatch.usuario_destino_id &&
                      styles.disabledButton,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {processandoAcaoId === detalhesMatch.usuario_destino_id
                      ? "Salvando..."
                      : "Curtir"}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={
                    processandoAcaoId === detalhesMatch.usuario_destino_id
                  }
                  onPress={() =>
                    handleAcao(detalhesMatch.usuario_destino_id, "ignorar")
                  }
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    styles.flexButton,
                    pressed && styles.secondaryButtonPressed,
                    processandoAcaoId === detalhesMatch.usuario_destino_id &&
                      styles.disabledButton,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Ignorar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historico</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionMeta}>
                {interacoes.length} registro(s)
              </Text>
            </View>
          </View>

          {interacoes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Nenhuma interacao registrada ate agora.
              </Text>
            </View>
          ) : (
            interacoes.map((interacao) => (
              <HistoricoCard
                interacao={interacao}
                key={interacao.id || interacao.usuario_destino_id}
              />
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
    lineHeight: 34,
  },
  heroSubtitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  statValue: {
    color: theme.colors.textStrong,
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  panel: {
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
    gap: 12,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.colors.textStrong,
    flex: 1,
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
  emptyState: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  emptyTitle: {
    color: theme.colors.textStrong,
    fontSize: 15,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  matchCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  matchCardActive: {
    borderColor: theme.colors.border,
    borderWidth: 2,
  },
  matchCardButton: {
    gap: 12,
    padding: 14,
  },
  cardPressed: {
    opacity: 0.9,
  },
  matchHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  matchTitleBlock: {
    flex: 1,
    gap: 5,
  },
  matchName: {
    color: theme.colors.textStrong,
    fontSize: 17,
    fontWeight: "800",
  },
  matchMeta: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  scorePill: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scoreText: {
    color: theme.colors.textStrong,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  responsivePhotoFrame: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  responsivePhoto: {
    backgroundColor: theme.colors.surfaceStrong,
    width: "100%",
  },
  photoStrip: {
    marginTop: 2,
  },
  photoStripContent: {
    gap: 8,
    paddingRight: 2,
  },
  previewImageFrame: {
    width: 172,
  },
  previewImage: {
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    paddingTop: 0,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    justifyContent: "center",
    minHeight: 46,
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
    justifyContent: "center",
    minHeight: 46,
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
  flexButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
  detailContent: {
    gap: 16,
  },
  detailSummary: {
    gap: 6,
  },
  detailName: {
    color: theme.colors.textStrong,
    fontSize: 20,
    fontWeight: "800",
  },
  detailText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 88,
    padding: 12,
  },
  metricValue: {
    color: theme.colors.textStrong,
    fontSize: 22,
    fontWeight: "800",
  },
  metricLabel: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  detailSection: {
    gap: 10,
  },
  detailSectionTitle: {
    color: theme.colors.textStrong,
    fontSize: 16,
    fontWeight: "800",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagText: {
    color: theme.colors.textStrong,
    fontSize: 12,
    fontWeight: "700",
  },
  photoSection: {
    gap: 12,
  },
  photoGrid: {
    gap: 10,
  },
  photoCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  photoCardImage: {
    width: "100%",
  },
  photoCardTextBlock: {
    gap: 4,
    padding: 10,
  },
  photoCardTitle: {
    color: theme.colors.textStrong,
    fontSize: 13,
    fontWeight: "800",
  },
  photoCardMeta: {
    color: theme.colors.text,
    fontSize: 11,
    lineHeight: 16,
  },
  commonPhotoList: {
    gap: 12,
  },
  commonPhotoCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  commonPhotoImage: {
    width: "100%",
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  statusPill: {
    backgroundColor: theme.colors.successMuted,
    borderColor: "rgba(216, 243, 176, 0.24)",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: "800",
  },
});
