import { useEffect, useState } from 'react'

function Perfil({
  usuario,
  onSalvarEdicao,
  onExcluirConta,
  onSair,
  carregando,
}) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(usuario?.nome || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [senha, setSenha] = useState('')

  useEffect(() => {
    setNome(usuario?.nome || '')
    setEmail(usuario?.email || '')
    setSenha('')
    setEditando(false)
  }, [usuario])

  async function handleSubmit(e) {
    e.preventDefault()

    await onSalvarEdicao({
      nome,
      email,
      senha,
    })

    setSenha('')
    setEditando(false)
  }

  async function handleExcluir() {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir sua conta?'
    )

    if (!confirmou) return

    await onExcluirConta()
  }

  if (!editando) {
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
        <br></br>
        <div className="acoes-perfil">
            <button type="button" onClick={() => setEditando(true)} disabled={carregando}>
                Editar
            </button>
            <button
                type="button"
                className="botao-perigo"
                onClick={handleExcluir}
                disabled={carregando}>
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

  return (
    <>
      <h1>Editar Perfil</h1>

      <form onSubmit={handleSubmit}>
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
          {carregando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      <p className="troca-pagina">
        <button
          type="button"
          className="botao-link"
          onClick={() => {
            setNome(usuario.nome)
            setEmail(usuario.email)
            setSenha('')
            setEditando(false)
          }}
        >
          Cancelar edição
        </button>
      </p>
    </>
  )
}

export default Perfil