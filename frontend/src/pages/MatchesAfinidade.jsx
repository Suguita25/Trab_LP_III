import { useEffect, useState } from 'react'

import {
  buscarDetalhesMatchUsuario,
  curtirMatchUsuario,
  ignorarMatchUsuario,
  listarInteracoesMatchUsuario,
  listarMatchesUsuario,
} from '../services/api'
import './MatchesAfinidade.css'

function formatarStatus(status) {
  if (status === 'curtido') return 'Curtido'
  if (status === 'ignorado') return 'Ignorado'
  return 'Sugerido'
}

function formatarData(data) {
  if (!data) return 'Agora mesmo'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function resumirLocais(locais) {
  if (!locais?.length) return 'Nenhum local em comum ainda.'

  return locais.slice(0, 3).join(', ')
}

export default function MatchesAfinidade({ usuarioLogado }) {
  const [matches, setMatches] = useState([])
  const [interacoes, setInteracoes] = useState([])
  const [matchSelecionadoId, setMatchSelecionadoId] = useState(null)
  const [detalhesMatch, setDetalhesMatch] = useState(null)
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  const [processandoAcaoId, setProcessandoAcaoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      if (!usuarioLogado?.id) {
        setMatches([])
        setInteracoes([])
        setMatchSelecionadoId(null)
        setDetalhesMatch(null)
        setCarregandoLista(false)
        return
      }

      try {
        setCarregandoLista(true)
        setMensagem('')
        setErro('')

        const [matchesCarregados, interacoesCarregadas] = await Promise.all([
          listarMatchesUsuario(usuarioLogado.id),
          listarInteracoesMatchUsuario(usuarioLogado.id),
        ])

        setMatches(matchesCarregados)
        setInteracoes(interacoesCarregadas)

        if (matchesCarregados.length > 0) {
          setMatchSelecionadoId(matchesCarregados[0].usuario_destino_id)
        } else {
          setMatchSelecionadoId(null)
          setDetalhesMatch(null)
        }
      } catch (err) {
        setErro(err.message || 'Erro ao carregar recomendacoes.')
      } finally {
        setCarregandoLista(false)
      }
    }

    carregarDados()
  }, [usuarioLogado])

  useEffect(() => {
    async function carregarDetalhes() {
      if (!usuarioLogado?.id || !matchSelecionadoId) {
        if (!matchSelecionadoId) {
          setDetalhesMatch(null)
        }
        return
      }

      try {
        setCarregandoDetalhes(true)
        setErro('')
        const detalhes = await buscarDetalhesMatchUsuario(
          usuarioLogado.id,
          matchSelecionadoId
        )
        setDetalhesMatch(detalhes)
      } catch (err) {
        setErro(err.message || 'Erro ao carregar detalhes do match.')
      } finally {
        setCarregandoDetalhes(false)
      }
    }

    carregarDetalhes()
  }, [usuarioLogado, matchSelecionadoId])

  async function atualizarRecomendacoes() {
    if (!usuarioLogado?.id) return

    try {
      setCarregandoLista(true)
      setMensagem('')
      setErro('')

      const matchesCarregados = await listarMatchesUsuario(usuarioLogado.id)
      setMatches(matchesCarregados)

      if (
        matchesCarregados.length > 0 &&
        !matchesCarregados.some(
          (match) => match.usuario_destino_id === matchSelecionadoId
        )
      ) {
        setMatchSelecionadoId(matchesCarregados[0].usuario_destino_id)
      }

      if (matchesCarregados.length === 0) {
        setMatchSelecionadoId(null)
        setDetalhesMatch(null)
      }
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar recomendacoes.')
    } finally {
      setCarregandoLista(false)
    }
  }

  async function handleAcao(outroUsuarioId, acao) {
    if (!usuarioLogado?.id) return

    try {
      setProcessandoAcaoId(outroUsuarioId)
      setMensagem('')
      setErro('')

      const resposta =
        acao === 'curtir'
          ? await curtirMatchUsuario(usuarioLogado.id, outroUsuarioId)
          : await ignorarMatchUsuario(usuarioLogado.id, outroUsuarioId)

      const matchAtualizado = resposta.match
      const proximosMatches = matches.filter(
        (match) => match.usuario_destino_id !== outroUsuarioId
      )

      setMatches(proximosMatches)
      setInteracoes((interacoesAtuais) => [
        matchAtualizado,
        ...interacoesAtuais.filter(
          (match) => match.usuario_destino_id !== outroUsuarioId
        ),
      ])
      setMensagem(resposta.mensagem || 'Interacao registrada com sucesso.')

      if (matchSelecionadoId === outroUsuarioId) {
        if (proximosMatches.length > 0) {
          setMatchSelecionadoId(proximosMatches[0].usuario_destino_id)
        } else {
          setMatchSelecionadoId(null)
          setDetalhesMatch(null)
        }
      }
    } catch (err) {
      setErro(err.message || 'Erro ao registrar interacao.')
    } finally {
      setProcessandoAcaoId(null)
    }
  }

  if (!usuarioLogado) {
    return (
      <div className="matches-afinidade">
        <section className="matches-afinidade__painel matches-afinidade__painel--vazio">
          <h1>Matches por Afinidade</h1>
          <p>Faca login para visualizar recomendacoes baseadas nos locais visitados.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="matches-afinidade">
      <section className="matches-afinidade__hero">
        <div>
          <h1>Matches por Afinidade</h1>
          <p>
            O sistema compara os pontos desbloqueados pelo usuario e sugere
            pessoas com roteiro parecido.
          </p>
        </div>

        <button
          type="button"
          className="matches-afinidade__botao matches-afinidade__botao--secundario"
          onClick={atualizarRecomendacoes}
          disabled={carregandoLista}
        >
          {carregandoLista ? 'Atualizando...' : 'Atualizar recomendacoes'}
        </button>
      </section>

      {mensagem && (
        <div className="matches-afinidade__mensagem matches-afinidade__mensagem--sucesso">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="matches-afinidade__mensagem matches-afinidade__mensagem--erro">
          {erro}
        </div>
      )}

      <section className="matches-afinidade__layout">
        <div className="matches-afinidade__painel">
          <div className="matches-afinidade__painel-topo">
            <h2>Recomendacoes</h2>
            <span>{matches.length} sugestao(oes)</span>
          </div>

          {carregandoLista ? (
            <div className="matches-afinidade__estado">Carregando matches...</div>
          ) : matches.length === 0 ? (
            <div className="matches-afinidade__estado">
              Nenhuma recomendacao disponivel no momento. Desbloqueie mais locais
              para ampliar sua rede.
            </div>
          ) : (
            <div className="matches-afinidade__lista">
              {matches.map((match) => {
                const estaSelecionado =
                  match.usuario_destino_id === matchSelecionadoId

                return (
                  <article
                    key={match.usuario_destino_id}
                    className={
                      estaSelecionado
                        ? 'match-card match-card--ativo'
                        : 'match-card'
                    }
                  >
                    <button
                      type="button"
                      className="match-card__detalhe"
                      onClick={() =>
                        setMatchSelecionadoId(match.usuario_destino_id)
                      }
                    >
                      <div className="match-card__topo">
                        <div>
                          <h3>{match.usuario_destino_nome}</h3>
                          <p>{match.quantidade_locais_em_comum} locais em comum</p>
                        </div>

                        <span className="match-card__score">
                          {match.score_afinidade.toFixed(2)}%
                        </span>
                      </div>

                      <p className="match-card__resumo">
                        {resumirLocais(match.locais_em_comum)}
                      </p>
                    </button>

                    <div className="match-card__acoes">
                      <button
                        type="button"
                        className="matches-afinidade__botao"
                        onClick={() =>
                          handleAcao(match.usuario_destino_id, 'curtir')
                        }
                        disabled={processandoAcaoId === match.usuario_destino_id}
                      >
                        {processandoAcaoId === match.usuario_destino_id
                          ? 'Salvando...'
                          : 'Curtir'}
                      </button>

                      <button
                        type="button"
                        className="matches-afinidade__botao matches-afinidade__botao--secundario"
                        onClick={() =>
                          handleAcao(match.usuario_destino_id, 'ignorar')
                        }
                        disabled={processandoAcaoId === match.usuario_destino_id}
                      >
                        Ignorar
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <div className="matches-afinidade__painel">
          <div className="matches-afinidade__painel-topo">
            <h2>Detalhes da afinidade</h2>
            {detalhesMatch && (
              <span>{formatarStatus(detalhesMatch.status)}</span>
            )}
          </div>

          {!matchSelecionadoId ? (
            <div className="matches-afinidade__estado">
              Selecione uma recomendacao para visualizar a compatibilidade.
            </div>
          ) : carregandoDetalhes ? (
            <div className="matches-afinidade__estado">
              Carregando detalhes do match...
            </div>
          ) : !detalhesMatch ? (
            <div className="matches-afinidade__estado">
              Nao foi possivel carregar os detalhes desta recomendacao.
            </div>
          ) : (
            <div className="matches-detalhe">
              <div className="matches-detalhe__resumo">
                <h3>{detalhesMatch.usuario_destino_nome}</h3>
                <p>
                  {detalhesMatch.quantidade_locais_em_comum} locais em comum e{' '}
                  {detalhesMatch.score_afinidade.toFixed(2)}% de afinidade.
                </p>
              </div>

              <div className="matches-detalhe__metricas">
                <div>
                  <strong>{detalhesMatch.total_locais_usuario_origem}</strong>
                  <span>Locais seus</span>
                </div>
                <div>
                  <strong>{detalhesMatch.total_locais_usuario_destino}</strong>
                  <span>Locais do match</span>
                </div>
                <div>
                  <strong>{detalhesMatch.quantidade_locais_em_comum}</strong>
                  <span>Intersecoes</span>
                </div>
              </div>

              <div className="matches-detalhe__locais">
                <h4>Locais em comum</h4>

                {detalhesMatch.locais_em_comum.length > 0 ? (
                  <div className="matches-detalhe__tags">
                    {detalhesMatch.locais_em_comum.map((local) => (
                      <span key={local} className="matches-detalhe__tag">
                        {local}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>Nenhum local compartilhado ate o momento.</p>
                )}
              </div>

              <div className="match-card__acoes">
                <button
                  type="button"
                  className="matches-afinidade__botao"
                  onClick={() =>
                    handleAcao(detalhesMatch.usuario_destino_id, 'curtir')
                  }
                  disabled={processandoAcaoId === detalhesMatch.usuario_destino_id}
                >
                  {processandoAcaoId === detalhesMatch.usuario_destino_id
                    ? 'Salvando...'
                    : 'Curtir recomendacao'}
                </button>

                <button
                  type="button"
                  className="matches-afinidade__botao matches-afinidade__botao--secundario"
                  onClick={() =>
                    handleAcao(detalhesMatch.usuario_destino_id, 'ignorar')
                  }
                  disabled={processandoAcaoId === detalhesMatch.usuario_destino_id}
                >
                  Ignorar recomendacao
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="matches-afinidade__painel">
        <div className="matches-afinidade__painel-topo">
          <h2>Historico de interacoes</h2>
          <span>{interacoes.length} registro(s)</span>
        </div>

        {interacoes.length === 0 ? (
          <div className="matches-afinidade__estado">
            Nenhuma interacao registrada ate agora.
          </div>
        ) : (
          <div className="matches-afinidade__historico">
            {interacoes.map((interacao) => (
              <article key={interacao.id} className="interacao-card">
                <div className="interacao-card__topo">
                  <div>
                    <h3>{interacao.usuario_destino_nome}</h3>
                    <p>
                      {interacao.quantidade_locais_em_comum} locais em comum
                    </p>
                  </div>

                  <span className="interacao-card__status">
                    {formatarStatus(interacao.status)}
                  </span>
                </div>

                <p className="interacao-card__meta">
                  Afinidade de {interacao.score_afinidade.toFixed(2)}% em{' '}
                  {formatarData(interacao.atualizado_em)}
                </p>
                <p className="interacao-card__meta">
                  Locais: {resumirLocais(interacao.locais_em_comum)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
