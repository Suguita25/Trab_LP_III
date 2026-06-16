import { useState } from 'react'

import VerificacaoIdentidade from '../components/VerificacaoIdentidade'

function formatarData(data) {
  if (!data) return 'Nenhum registro'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function calcularPercentual(atual, total) {
  if (!total) return 0
  return (atual / total) * 100
}

function Perfil({
  usuario,
  fotos,
  resumoGamificacao,
  onSalvarEdicao,
  onPostarFoto,
  onExcluirConta,
  carregando,
}) {
  const [editandoDados, setEditandoDados] = useState(false)
  const [postandoFoto, setPostandoFoto] = useState(false)
  const [nome, setNome] = useState(usuario?.nome || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [senha, setSenha] = useState('')
  const [fotoPostagem, setFotoPostagem] = useState('')
  const [origemFotoPostagem, setOrigemFotoPostagem] = useState('')
  const [erroPostagemLocal, setErroPostagemLocal] = useState('')

  const progresso = resumoGamificacao || {
    totalLocais: 0,
    locaisDesbloqueados: 0,
    pontosTotaisUsuario: 0,
    totalPontosPossiveis: 0,
  }

  async function handleSubmitDados(e) {
    e.preventDefault()

    await onSalvarEdicao({
      nome,
      email,
      senha,
    })

    setSenha('')
    setEditandoDados(false)
  }

  async function handleSubmitPostagem(e) {
    e.preventDefault()

    if (!fotoPostagem || !origemFotoPostagem) {
      setErroPostagemLocal(
        'Selecione uma foto para publicar usando a camera ou a galeria.'
      )
      return
    }

    setErroPostagemLocal('')

    try {
      await onPostarFoto({
        foto: fotoPostagem,
        origemFoto: origemFotoPostagem,
      })

      setFotoPostagem('')
      setOrigemFotoPostagem('')
      setPostandoFoto(false)
    } catch {
      // O feedback global da tela ja exibe o detalhe da API.
    }
  }

  async function handleExcluir() {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir sua conta?'
    )

    if (!confirmou) return

    await onExcluirConta()
  }

  function handleAtualizarFotoPostagem({
    foto: novaFoto,
    origemFoto: novaOrigem,
  }) {
    setFotoPostagem(novaFoto)
    setOrigemFotoPostagem(novaOrigem)
    setErroPostagemLocal('')
  }

  function cancelarEdicaoDados() {
    setNome(usuario.nome)
    setEmail(usuario.email)
    setSenha('')
    setEditandoDados(false)
  }

  function cancelarPostagem() {
    setFotoPostagem('')
    setOrigemFotoPostagem('')
    setErroPostagemLocal('')
    setPostandoFoto(false)
  }

  if (editandoDados) {
    return (
      <>
        <h1>Editar Perfil</h1>

        <form onSubmit={handleSubmitDados}>
          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Digite a nova senha ou repita a atual"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <button type="submit" disabled={carregando}>
            {carregando ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </form>

        <p className="troca-pagina">
          <button
            type="button"
            className="botao-link"
            onClick={cancelarEdicaoDados}
          >
            Cancelar edicao
          </button>
        </p>
      </>
    )
  }

  if (postandoFoto) {
    return (
      <>
        <h1>Postar Foto</h1>

        <form onSubmit={handleSubmitPostagem}>
          <VerificacaoIdentidade
            value={fotoPostagem}
            origemFoto={origemFotoPostagem}
            onChange={handleAtualizarFotoPostagem}
            desabilitada={carregando}
            titulo="Postar foto"
            descricao={
              'Escolha a foto que deseja publicar. Antes do envio, o backend faz o matching facial com a sua foto de verificacao.'
            }
            textoVazioOpcional={
              'Selecione a foto que deseja publicar. A postagem so sera liberada se o matching facial aprovar.'
            }
          />

          {erroPostagemLocal && (
            <p className="erro erro-inline">{erroPostagemLocal}</p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Verificando...' : 'Verificar e postar foto'}
          </button>
        </form>

        <p className="troca-pagina">
          <button
            type="button"
            className="botao-link"
            onClick={cancelarPostagem}
          >
            Cancelar postagem
          </button>
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Perfil</h1>

      <div className="perfil-info">
        <p>
          <strong>ID:</strong> {usuario.id}
        </p>
        <p>
          <strong>Nome:</strong> {usuario.nome}
        </p>
        <p>
          <strong>E-mail:</strong> {usuario.email}
        </p>
        <p>
          <strong>Pontos totais:</strong>{' '}
          {usuario.pontos_totais ?? progresso.pontosTotaisUsuario}
        </p>
      </div>

      <div className="progresso-gamificacao">
        <div className="progresso-gamificacao__topo">
          <h2>Seu progresso</h2>
        </div>

        <div className="progresso-gamificacao__item">
          <div className="progresso-gamificacao__linha">
            <span>Locais desbloqueados</span>
            <strong>
              {progresso.locaisDesbloqueados} / {progresso.totalLocais}
            </strong>
          </div>
          <div className="progresso-gamificacao__barra">
            <div
              className="progresso-gamificacao__preenchimento"
              style={{
                width: `${calcularPercentual(
                  progresso.locaisDesbloqueados,
                  progresso.totalLocais
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="progresso-gamificacao__item">
          <div className="progresso-gamificacao__linha">
            <span>Pontos acumulados</span>
            <strong>
              {progresso.pontosTotaisUsuario} / {progresso.totalPontosPossiveis}
            </strong>
          </div>
          <div className="progresso-gamificacao__barra">
            <div
              className="progresso-gamificacao__preenchimento"
              style={{
                width: `${calcularPercentual(
                  progresso.pontosTotaisUsuario,
                  progresso.totalPontosPossiveis
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="verificacao-box">
        <div className="verificacao-topo">
          <h2>Minhas fotos</h2>
        </div>

        {fotos.length > 0 ? (
          <div className="galeria-fotos">
            {fotos.map((foto) => (
              <article key={foto.id} className="card-foto-publicada">
                <img
                  src={foto.foto}
                  alt={`Foto publicada ${foto.id}`}
                  className="foto-publicada-img"
                />
                <div className="foto-publicada-meta">
                  <p>
                    <strong>Publicada em:</strong>{' '}
                    {formatarData(foto.data_postagem)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="verificacao-hint">
            Nenhuma foto publicada ainda.
          </p>
        )}
      </div>

      <div className="acoes-perfil">
        <button
          type="button"
          onClick={() => setEditandoDados(true)}
          disabled={carregando}
        >
          Editar dados
        </button>
        <button
          type="button"
          onClick={() => setPostandoFoto(true)}
          disabled={carregando}
        >
          Postar foto
        </button>
        <button
          type="button"
          className="botao-perigo"
          onClick={handleExcluir}
          disabled={carregando}
        >
          Excluir conta
        </button>
      </div>
    </>
  )
}

export default Perfil
