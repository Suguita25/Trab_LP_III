import { useState } from 'react'

import VerificacaoIdentidade from '../components/VerificacaoIdentidade'

function formatarStatusVerificacao(status) {
  if (status === 'em_analise') return 'Em analise'
  if (status === 'aprovado') return 'Aprovado'
  if (status === 'rejeitado') return 'Rejeitado'
  return 'Nao enviado'
}

function getClasseStatus(status) {
  if (status === 'em_analise') return 'badge-status status-analise'
  if (status === 'aprovado') return 'badge-status status-aprovado'
  if (status === 'rejeitado') return 'badge-status status-rejeitado'
  return 'badge-status status-neutro'
}

function formatarOrigemFoto(origem) {
  if (origem === 'camera') return 'Camera do notebook'
  if (origem === 'galeria') return 'Galeria'
  return 'Nao informada'
}

function formatarData(data) {
  if (!data) return 'Nenhum registro'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function Perfil({
  usuario,
  fotos,
  onSalvarEdicao,
  onEnviarVerificacao,
  onPostarFoto,
  onExcluirConta,
  onSair,
  carregando,
}) {
  const [editandoDados, setEditandoDados] = useState(false)
  const [editandoVerificacao, setEditandoVerificacao] = useState(false)
  const [postandoFoto, setPostandoFoto] = useState(false)
  const [nome, setNome] = useState(usuario?.nome || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [senha, setSenha] = useState('')
  const [fotoVerificacao, setFotoVerificacao] = useState(
    usuario?.foto_verificacao || ''
  )
  const [origemFotoVerificacao, setOrigemFotoVerificacao] = useState(
    usuario?.verificacao_origem_foto || ''
  )
  const [fotoPostagem, setFotoPostagem] = useState('')
  const [origemFotoPostagem, setOrigemFotoPostagem] = useState('')
  const [erroVerificacaoLocal, setErroVerificacaoLocal] = useState('')
  const [erroPostagemLocal, setErroPostagemLocal] = useState('')

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

  async function handleSubmitVerificacao(e) {
    e.preventDefault()

    if (!fotoVerificacao || !origemFotoVerificacao) {
      setErroVerificacaoLocal(
        'Selecione uma foto pela camera do notebook ou pela galeria.'
      )
      return
    }

    setErroVerificacaoLocal('')

    try {
      await onEnviarVerificacao({
        fotoVerificacao,
        origemFoto: origemFotoVerificacao,
      })

      setEditandoVerificacao(false)
    } catch {
      // O feedback global da tela ja exibe o detalhe da API.
    }
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

  function handleAtualizarFotoVerificacao({
    foto: novaFoto,
    origemFoto: novaOrigem,
  }) {
    setFotoVerificacao(novaFoto)
    setOrigemFotoVerificacao(novaOrigem)
    setErroVerificacaoLocal('')
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

  function cancelarEdicaoVerificacao() {
    setFotoVerificacao(usuario?.foto_verificacao || '')
    setOrigemFotoVerificacao(usuario?.verificacao_origem_foto || '')
    setErroVerificacaoLocal('')
    setEditandoVerificacao(false)
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

  if (editandoVerificacao) {
    return (
      <>
        <h1>Verificacao de Identidade</h1>

        <form onSubmit={handleSubmitVerificacao}>
          <VerificacaoIdentidade
            value={fotoVerificacao}
            origemFoto={origemFotoVerificacao}
            onChange={handleAtualizarFotoVerificacao}
            desabilitada={carregando}
          />

          {erroVerificacaoLocal && (
            <p className="erro erro-inline">{erroVerificacaoLocal}</p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Enviando...' : 'Enviar nova foto'}
          </button>
        </form>

        <p className="troca-pagina">
          <button
            type="button"
            className="botao-link"
            onClick={cancelarEdicaoVerificacao}
          >
            Cancelar verificacao
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
      </div>

      <div className="verificacao-box verificacao-box-status">
        <div className="verificacao-topo">
          <h2>Verificacao de identidade</h2>
          <p>
            Envie uma foto sua pela camera do notebook ou anexando uma imagem da galeria.
          </p>
        </div>

        <div className="verificacao-detalhes">
          <p>
            <strong>Status:</strong>{' '}
            <span className={getClasseStatus(usuario.verificacao_status)}>
              {formatarStatusVerificacao(usuario.verificacao_status)}
            </span>
          </p>
          <p>
            <strong>Origem da foto:</strong>{' '}
            {formatarOrigemFoto(usuario.verificacao_origem_foto)}
          </p>
          <p>
            <strong>Ultimo envio:</strong> {formatarData(usuario.verificacao_data_envio)}
          </p>
        </div>

        {usuario.foto_verificacao ? (
          <div className="foto-preview-box">
            <img
              src={usuario.foto_verificacao}
              alt="Foto de verificacao do usuario"
              className="foto-preview"
            />
            <div className="foto-preview-meta">
              <p>
                Esta e a foto oficial usada como referencia para liberar novas publicacoes.
              </p>
              <p>
                Toda foto postada passa por matching facial antes de ser aceita.
              </p>
            </div>
          </div>
        ) : (
          <p className="verificacao-hint">
            Nenhuma foto de verificacao foi enviada ate agora.
          </p>
        )}
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
                    <strong>Publicada em:</strong> {formatarData(foto.data_postagem)}
                  </p>
                  <p>
                    <strong>Matching:</strong> {foto.modelo_match} liberou a postagem
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
          className="botao-secundario"
          onClick={() => setEditandoVerificacao(true)}
          disabled={carregando}
        >
          Atualizar verificacao
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
        <button
          type="button"
          className="botao-secundario"
          onClick={onSair}
          disabled={carregando}
        >
          Sair
        </button>
      </div>
    </>
  )
}

export default Perfil
