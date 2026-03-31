const API_BASE_URL = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  let data

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const mensagemErro =
      (typeof data === 'object' && (data.detail || data.mensagem)) ||
      (typeof data === 'string' && data) ||
      'Erro na requisicao'

    throw new Error(mensagemErro)
  }

  return data
}

export function loginUsuario({ email, senha }) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}

export function cadastrarUsuario({
  nome,
  email,
  senha,
  fotoVerificacao,
  origemFoto,
}) {
  return request('/cadastro', {
    method: 'POST',
    body: JSON.stringify({
      nome,
      email,
      senha,
      foto_verificacao: fotoVerificacao,
      verificacao_origem_foto: origemFoto,
    }),
  })
}

export function listarUsuarios() {
  return request('/usuarios')
}

export function buscarUsuarioPorEmail(email) {
  return request(`/usuarios/email/${encodeURIComponent(email)}`)
}

export function atualizarUsuario(id, { nome, email, senha }) {
  return request(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, email, senha }),
  })
}

export function enviarVerificacaoUsuario(id, { fotoVerificacao, origemFoto }) {
  return request(`/usuarios/${id}/verificacao`, {
    method: 'POST',
    body: JSON.stringify({
      foto_verificacao: fotoVerificacao,
      verificacao_origem_foto: origemFoto,
    }),
  })
}

export function listarFotosUsuario(id) {
  return request(`/usuarios/${id}/fotos`)
}

export function postarFotoUsuario(id, { foto, origemFoto }) {
  return request(`/usuarios/${id}/fotos`, {
    method: 'POST',
    body: JSON.stringify({
      foto,
      origem_foto: origemFoto,
    }),
  })
}

export function excluirUsuario(id) {
  return request(`/usuarios/${id}`, {
    method: 'DELETE',
  })
}

export function verificarHealthcheck() {
  return request('/healthcheck', {
    method: 'GET',
  })
}
