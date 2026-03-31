import { useState } from 'react'

import VerificacaoIdentidade from '../components/VerificacaoIdentidade'

function Cadastro({ onCadastro, onIrLogin, carregando }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [fotoVerificacao, setFotoVerificacao] = useState('')
  const [origemFoto, setOrigemFoto] = useState('')
  const [erroLocal, setErroLocal] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!fotoVerificacao || !origemFoto) {
      setErroLocal(
        'Envie uma foto de verificacao usando a camera do notebook ou a galeria.'
      )
      return
    }

    setErroLocal('')

    await onCadastro({
      nome,
      email,
      senha,
      fotoVerificacao,
      origemFoto,
    })
  }

  function handleAtualizarFoto({ foto: novaFoto, origemFoto: novaOrigem }) {
    setFotoVerificacao(novaFoto)
    setOrigemFoto(novaOrigem)
    setErroLocal('')
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

        <VerificacaoIdentidade
          value={fotoVerificacao}
          origemFoto={origemFoto}
          onChange={handleAtualizarFoto}
          obrigatoria
          desabilitada={carregando}
        />

        {erroLocal && <p className="erro erro-inline">{erroLocal}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className="troca-pagina">
        Ja tem conta?{' '}
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
