import { useState } from 'react'

function Cadastro({ onCadastro, onIrLogin, carregando }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await onCadastro({ nome, email, senha })
  }

  return (
    <>
      <h1>Cadastro</h1>

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
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button type="submit" disabled={carregando}>
          {carregando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className="troca-pagina">
        Já tem conta?{' '}
        <button
          type="button"
          className="botao-link"
          onClick={onIrLogin}
        >
          Voltar para login
        </button>
      </p>
    </>
  )
}

export default Cadastro