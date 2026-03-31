import { useEffect, useRef, useState } from 'react'

const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024

function VerificacaoIdentidade({
  value,
  origemFoto,
  onChange,
  obrigatoria = false,
  desabilitada = false,
  titulo = 'Verificacao de identidade',
  descricao = 'Tire uma foto com a camera do notebook ou anexe uma imagem da galeria.',
  textoVazioObrigatorio = 'Esta etapa e obrigatoria para criar a conta.',
  textoVazioOpcional = 'Selecione uma foto para atualizar a verificacao do perfil.',
  textoSeloObrigatorio = 'Obrigatorio para concluir o cadastro',
}) {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraAberta, setCameraAberta] = useState(false)
  const [erroCamera, setErroCamera] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')

  function fecharCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraAberta(false)
  }

  useEffect(() => {
    if (cameraAberta && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraAberta])

  useEffect(() => {
    return () => {
      fecharCamera()
    }
  }, [])

  async function abrirCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErroCamera(
        'Seu navegador nao permite acesso a camera neste ambiente.'
      )
      return
    }

    try {
      fecharCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream
      setErroCamera('')
      setNomeArquivo('')
      setCameraAberta(true)
    } catch {
      setErroCamera(
        'Nao foi possivel acessar a camera. Verifique a permissao do navegador.'
      )
    }
  }

  function capturarFoto() {
    const video = videoRef.current

    if (!video) {
      setErroCamera('A camera ainda nao esta pronta para captura.')
      return
    }

    const largura = video.videoWidth || 640
    const altura = video.videoHeight || 480
    const canvas = document.createElement('canvas')

    canvas.width = largura
    canvas.height = altura

    const contexto = canvas.getContext('2d')

    if (!contexto) {
      setErroCamera('Nao foi possivel processar a foto da camera.')
      return
    }

    contexto.drawImage(video, 0, 0, largura, altura)

    onChange({
      foto: canvas.toDataURL('image/jpeg', 0.92),
      origemFoto: 'camera',
    })

    setErroCamera('')
    setNomeArquivo('')
    fecharCamera()
  }

  function abrirGaleria() {
    fileInputRef.current?.click()
  }

  function limparFoto() {
    onChange({
      foto: '',
      origemFoto: '',
    })

    setNomeArquivo('')
    setErroCamera('')
  }

  function handleFileChange(event) {
    const arquivo = event.target.files?.[0]

    if (!arquivo) return

    if (!arquivo.type.startsWith('image/')) {
      setErroCamera('Selecione um arquivo de imagem valido.')
      event.target.value = ''
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErroCamera('A foto deve ter no maximo 5 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      onChange({
        foto: reader.result,
        origemFoto: 'galeria',
      })

      setNomeArquivo(arquivo.name)
      setErroCamera('')
      fecharCamera()
    }

    reader.onerror = () => {
      setErroCamera('Nao foi possivel ler a imagem selecionada.')
    }

    reader.readAsDataURL(arquivo)
    event.target.value = ''
  }

  return (
    <section className="verificacao-box">
      <div className="verificacao-topo">
        <h2>{titulo}</h2>
        <p>{descricao}</p>
      </div>

      <div className="verificacao-acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={abrirCamera}
          disabled={desabilitada}
        >
          Usar camera do notebook
        </button>
        <button
          type="button"
          className="botao-secundario"
          onClick={abrirGaleria}
          disabled={desabilitada}
        >
          Anexar foto da galeria
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="input-arquivo-oculto"
        onChange={handleFileChange}
        disabled={desabilitada}
      />

      {cameraAberta && (
        <div className="camera-box">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
          />

          <div className="camera-acoes">
            <button
              type="button"
              onClick={capturarFoto}
              disabled={desabilitada}
            >
              Capturar foto
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={fecharCamera}
              disabled={desabilitada}
            >
              Fechar camera
            </button>
          </div>
        </div>
      )}

      {value ? (
        <div className="foto-preview-box">
          <img
            src={value}
            alt="Pre-visualizacao da foto"
            className="foto-preview"
          />

          <div className="foto-preview-meta">
            <p>
              <strong>Origem:</strong>{' '}
              {origemFoto === 'camera' ? 'Camera do notebook' : 'Galeria'}
            </p>
            {nomeArquivo && (
              <p>
                <strong>Arquivo:</strong> {nomeArquivo}
              </p>
            )}
            {obrigatoria && (
              <span className="campo-obrigatorio">
                {textoSeloObrigatorio}
              </span>
            )}
            <button
              type="button"
              className="botao-link botao-link-inline"
              onClick={limparFoto}
              disabled={desabilitada}
            >
              Remover foto
            </button>
          </div>
        </div>
      ) : (
        <p className="verificacao-hint">
          {obrigatoria ? textoVazioObrigatorio : textoVazioOpcional}
        </p>
      )}

      {erroCamera && <p className="erro erro-inline">{erroCamera}</p>}
    </section>
  )
}

export default VerificacaoIdentidade
