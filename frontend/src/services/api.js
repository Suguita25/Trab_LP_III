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
      'Erro na requisição'

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

export function cadastrarUsuario({ nome, email, senha }) {
  return request('/cadastro', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha }),
  })
}

export function listarUsuarios() {
  return request('/usuarios')
}

export async function buscarUsuarioPorEmail(email) {
  const usuarios = await listarUsuarios()
  const usuario = usuarios.find((item) => item.email === email)

  if (!usuario) {
    throw new Error('Usuário não encontrado')
  }

  return usuario
}

export function atualizarUsuario(id, { nome, email, senha }) {
  return request(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, email, senha }),
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