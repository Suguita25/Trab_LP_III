import { useState } from 'react'

import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Cadastro from './pages/Cadastro'
import HealthCheck from './pages/HealthCheck'
import Login from './pages/Login'
import MapaGamificado from './pages/MapaGamificado'
import MatchesAfinidade from './pages/MatchesAfinidade'
import Perfil from './pages/Perfil'
import {
  atualizarUsuario,
  buscarUsuarioPorEmail,
  cadastrarUsuario,
  enviarVerificacaoUsuario,
  excluirUsuario,
  listarFotosUsuario,
  loginUsuario,
  postarFotoUsuario,
} from './services/api'
import { getLocations, getUnlockedPoints } from './services/gamificationApi'

function getTituloPagina(pagina) {
  if (pagina === 'login') return 'Login'
  if (pagina === 'cadastro') return 'Cadastro'
  if (pagina === 'perfil') return 'Perfil do usuario'
  if (pagina === 'healthcheck') return 'Health Check'
  if (pagina === 'mapa-gamificado') return 'Mapa Gamificado'
  if (pagina === 'matches-afinidade') return 'Matches por Afinidade'
  return 'Sistema'
}

function App() {
  const [pagina, setPagina] = useState('login')
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [fotosUsuario, setFotosUsuario] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  const [resumoGamificacao, setResumoGamificacao] = useState({
    totalLocais: 0,
    locaisDesbloqueados: 0,
    pontosTotaisUsuario: 0,
    totalPontosPossiveis: 0,
  })

  function limparFeedback() {
    setMensagem('')
    setErro('')
  }

  function resetarResumoGamificacao() {
    setResumoGamificacao({
      totalLocais: 0,
      locaisDesbloqueados: 0,
      pontosTotaisUsuario: 0,
      totalPontosPossiveis: 0,
    })
  }

  async function carregarResumoGamificacao(usuarioId, pontosTotaisUsuario = 0) {
    try {
      const [locations, desbloqueios] = await Promise.all([
        getLocations(),
        getUnlockedPoints(usuarioId),
      ])

      const totalPontosPossiveis = locations.reduce(
        (acc, location) => acc + (location.pontos_valor || 0),
        0
      )

      setResumoGamificacao({
        totalLocais: locations.length,
        locaisDesbloqueados: desbloqueios.pontos_desbloqueados?.length || 0,
        pontosTotaisUsuario,
        totalPontosPossiveis,
      })
    } catch (err) {
      console.error('erro ao carregar resumo de gamificacao:', err)
    }
  }

  function atualizarResumoGamificacao({
    pontosTotaisUsuario,
    locaisDesbloqueados,
  }) {
    setResumoGamificacao((prev) => ({
      ...prev,
      pontosTotaisUsuario:
        pontosTotaisUsuario ?? prev.pontosTotaisUsuario,
      locaisDesbloqueados:
        locaisDesbloqueados ?? prev.locaisDesbloqueados,
    }))

    setUsuarioLogado((prev) =>
      prev
        ? {
            ...prev,
            pontos_totais:
              pontosTotaisUsuario ?? prev.pontos_totais,
          }
        : prev
    )
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

  function irParaMapaGamificado() {
    limparFeedback()
    setPagina('mapa-gamificado')
  }

  function irParaMatchesAfinidade() {
    limparFeedback()

    if (usuarioLogado) {
      setPagina('matches-afinidade')
    }
  }

  function sair() {
    limparFeedback()
    setUsuarioLogado(null)
    setFotosUsuario([])
    resetarResumoGamificacao()
    setPagina('login')
  }

  function abrirSidebar() {
    setSidebarAberta(true)
  }

  function fecharSidebar() {
    setSidebarAberta(false)
  }

  async function handleLogin({ email, senha }) {
    limparFeedback()
    setCarregando(true)

    try {
      const respostaLogin = await loginUsuario({ email, senha })
      const usuario = await buscarUsuarioPorEmail(email)
      let fotos = []

      try {
        fotos = await listarFotosUsuario(usuario.id)
      } catch {
        fotos = []
      }

      setUsuarioLogado(usuario)
      setFotosUsuario(fotos)
      await carregarResumoGamificacao(usuario.id, usuario.pontos_totais || 0)
      setPagina('perfil')
      setMensagem(respostaLogin.mensagem || 'Login realizado com sucesso')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleCadastro({
    nome,
    email,
    senha,
    fotoVerificacao,
    origemFoto,
  }) {
    limparFeedback()
    setCarregando(true)

    try {
      await cadastrarUsuario({
        nome,
        email,
        senha,
        fotoVerificacao,
        origemFoto,
      })
      setPagina('login')
      setMensagem(
        'Cadastro realizado com sucesso. Sua foto de verificacao foi enviada para analise. Faca seu login.'
      )
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

  async function handleEnviarVerificacao({ fotoVerificacao, origemFoto }) {
    if (!usuarioLogado) return

    limparFeedback()
    setCarregando(true)

    try {
      const usuarioAtualizado = await enviarVerificacaoUsuario(usuarioLogado.id, {
        fotoVerificacao,
        origemFoto,
      })

      setUsuarioLogado(usuarioAtualizado)
      setMensagem('Nova foto de verificacao enviada para analise.')
    } catch (err) {
      setErro(err.message)
      throw err
    } finally {
      setCarregando(false)
    }
  }

  async function handlePostarFoto({ foto, origemFoto }) {
    if (!usuarioLogado) return

    limparFeedback()
    setCarregando(true)

    try {
      const fotoPublicada = await postarFotoUsuario(usuarioLogado.id, {
        foto,
        origemFoto,
      })

      setFotosUsuario((fotosAtuais) => [fotoPublicada, ...fotosAtuais])
      setMensagem(
        'Matching facial aprovado. A foto foi publicada com sucesso.'
      )
    } catch (err) {
      setErro(err.message)
      throw err
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
      setFotosUsuario([])
      resetarResumoGamificacao()
      setPagina('login')
      setMensagem(resposta.mensagem || 'Conta excluida com sucesso.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const paginaUsaBoxPequeno =
    pagina === 'login' ||
    pagina === 'cadastro' ||
    pagina === 'perfil' ||
    pagina === 'healthcheck'

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
        onIrMapaGamificado={irParaMapaGamificado}
        onIrMatchesAfinidade={irParaMatchesAfinidade}
        onSair={sair}
      />

      <div className="area-principal">
        <Header
          titulo={getTituloPagina(pagina)}
          onAbrirSidebar={abrirSidebar}
        />

        <main className="conteudo">
          {paginaUsaBoxPequeno ? (
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
                  key={[
                    usuarioLogado.id,
                    usuarioLogado.nome,
                    usuarioLogado.email,
                    usuarioLogado.verificacao_status,
                    usuarioLogado.verificacao_data_envio || 'sem-envio',
                    usuarioLogado.pontos_totais || 0,
                    resumoGamificacao.locaisDesbloqueados,
                  ].join(':')}
                  usuario={usuarioLogado}
                  fotos={fotosUsuario}
                  resumoGamificacao={resumoGamificacao}
                  onSalvarEdicao={handleSalvarEdicao}
                  onEnviarVerificacao={handleEnviarVerificacao}
                  onPostarFoto={handlePostarFoto}
                  onExcluirConta={handleExcluirConta}
                  onSair={sair}
                  carregando={carregando}
                />
              )}

              {pagina === 'healthcheck' && <HealthCheck />}

              {mensagem && <p className="sucesso">{mensagem}</p>}
              {erro && <p className="erro">{erro}</p>}
            </div>
          ) : (
            <>
              {pagina === 'mapa-gamificado' && (
                <MapaGamificado
                  usuarioLogado={usuarioLogado}
                  resumoGamificacao={resumoGamificacao}
                  onAtualizarResumoGamificacao={atualizarResumoGamificacao}
                />
              )}

              {pagina === 'matches-afinidade' && (
                <MatchesAfinidade usuarioLogado={usuarioLogado} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
