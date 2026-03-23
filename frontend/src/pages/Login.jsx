import { useState } from 'react'

function Login({ onLogin, onIrCadastro, carregando }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await onLogin({ email, senha })
  }

  return (
    <>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
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
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="troca-pagina">
        Não tem conta?{' '}
        <button
          type="button"
          className="botao-link"
          onClick={onIrCadastro}
        >
          Cadastre-se
        </button>
      </p>
    </>
  )
}

export default Login