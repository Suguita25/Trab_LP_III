import { useEffect, useState } from 'react'
import { verificarHealthcheck } from '../services/api'

function HealthCheck() {
  const [status, setStatus] = useState('Carregando...')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function carregarHealthcheck() {
    setErro('')
    setCarregando(true)

    try {
      const data = await verificarHealthcheck()
      setStatus(data.status || 'Sem status')
    } catch (err) {
      setErro(err.message)
      setStatus('')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarHealthcheck()
  }, [])

  return (
    <>
      <h1>Health Check</h1>

      <div className="health-box">
        {carregando && <p>Verificando backend...</p>}
        {!carregando && !erro && (
          <p>
            <strong>Status:</strong> {status}
          </p>
        )}
        {!carregando && erro && <p className="erro">{erro}</p>}
      </div>

      <button type="button" onClick={carregarHealthcheck}>
        Verificar novamente
      </button>
    </>
  )
}

export default HealthCheck