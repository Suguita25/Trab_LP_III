import { useState } from 'react'
import './App.css'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Perfil from './pages/Perfil'
import HealthCheck from './pages/HealthCheck'

import {
  loginUsuario,
  cadastrarUsuario,
  buscarUsuarioPorEmail,
  atualizarUsuario,
  excluirUsuario,
} from './services/api'

function getTituloPagina(pagina) {
  if (pagina === 'login') return 'Login'
  if (pagina === 'cadastro') return 'Cadastro'
  if (pagina === 'perfil') return 'Perfil do usuário'
  if (pagina === 'healthcheck') return 'Health Check'
  return 'Sistema'
}

function App() {
  const [pagina, setPagina] = useState('login')
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  function limparFeedback() {
    setMensagem('')
    setErro('')
  }

  function irParaLogin() {
    limparFeedback()
    setPagina('login')
  }

  function irParaCadastro() {
    limparFeedback()
    setPagina('cadastro')
  }

  function irParaPerfil() {
    limparFeedback()
    if (usuarioLogado) {
      setPagina('perfil')
    }
  }

  function irParaHealthcheck() {
    limparFeedback()
    setPagina('healthcheck')
  }

  function sair() {
    limparFeedback()
    setUsuarioLogado(null)
    setPagina('login')
  }

function abrirSidebar() {
  setSidebarAberta(true)
}

function fecharSidebar() {
  setSidebarAberta(false)
}

function getTituloPagina(pagina) {
  if (pagina === 'login') return 'Login'
  if (pagina === 'cadastro') return 'Cadastro'
  if (pagina === 'perfil') return 'Perfil do usuário'
  if (pagina === 'healthcheck') return 'Health Check'
  return 'Sistema'
}

  async function handleLogin({ email, senha }) {
    limparFeedback()
    setCarregando(true)

    try {
      const respostaLogin = await loginUsuario({ email, senha })
      const usuario = await buscarUsuarioPorEmail(email)

      setUsuarioLogado(usuario)
      setPagina('perfil')
      setMensagem(respostaLogin.mensagem || 'Login realizado com sucesso')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleCadastro({ nome, email, senha }) {
    limparFeedback()
    setCarregando(true)

    try {
      await cadastrarUsuario({ nome, email, senha })
      setPagina('login')
      setMensagem('Cadastro realizado com sucesso. Faça seu login.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleSalvarEdicao({ nome, email, senha }) {
    if (!usuarioLogado) return

    limparFeedback()
    setCarregando(true)

    try {
      const usuarioAtualizado = await atualizarUsuario(usuarioLogado.id, {
        nome,
        email,
        senha,
      })

      setUsuarioLogado(usuarioAtualizado)
      setMensagem('Dados atualizados com sucesso.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleExcluirConta() {
    if (!usuarioLogado) return

    limparFeedback()
    setCarregando(true)

    try {
      const resposta = await excluirUsuario(usuarioLogado.id)

      setUsuarioLogado(null)
      setPagina('login')
      setMensagem(resposta.mensagem || 'Conta excluída com sucesso.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="layout">
      <Sidebar
        aberta={sidebarAberta}
        paginaAtual={pagina}
        usuarioLogado={usuarioLogado}
        onFechar={fecharSidebar}
        onIrLogin={irParaLogin}
        onIrCadastro={irParaCadastro}
        onIrPerfil={irParaPerfil}
        onIrHealthcheck={irParaHealthcheck}
        onSair={sair}
      />

      <div className="area-principal">
        <Header
          titulo={getTituloPagina(pagina)}
          onAbrirSidebar={abrirSidebar}
        />

        <main className="conteudo">
          <div className="login-box">
            {pagina === 'login' && (
              <Login
                onLogin={handleLogin}
                onIrCadastro={irParaCadastro}
                carregando={carregando}
              />
            )}

            {pagina === 'cadastro' && (
              <Cadastro
                onCadastro={handleCadastro}
                onIrLogin={irParaLogin}
                carregando={carregando}
              />
            )}

            {pagina === 'perfil' && usuarioLogado && (
              <Perfil
                usuario={usuarioLogado}
                onSalvarEdicao={handleSalvarEdicao}
                onExcluirConta={handleExcluirConta}
                onSair={sair}
                carregando={carregando}
              />
            )}

            {pagina === 'healthcheck' && <HealthCheck />}

            {mensagem && <p className="sucesso">{mensagem}</p>}
            {erro && <p className="erro">{erro}</p>}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
