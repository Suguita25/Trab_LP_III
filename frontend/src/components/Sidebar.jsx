function Sidebar({
  aberta,
  paginaAtual,
  usuarioLogado,
  onFechar,
  onIrLogin,
  onIrCadastro,
  onIrPerfil,
  onIrHealthcheck,
  onSair,
}) {
  function handleAcao(acao) {
    acao()
    onFechar()
  }

  return (
    <>
      {aberta && <div className="sidebar-overlay" onClick={onFechar}></div>}

      <aside className={aberta ? 'sidebar-drawer aberta' : 'sidebar-drawer'}>
        <div className="sidebar-topo">
          <h2 className="sidebar-titulo">Menu</h2>

          <button
            type="button"
            className="sidebar-fechar"
            onClick={onFechar}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          className={paginaAtual === 'login' ? 'sidebar-btn ativo' : 'sidebar-btn'}
          onClick={() => handleAcao(onIrLogin)}
        >
          Login
        </button>

        <button
          type="button"
          className={paginaAtual === 'cadastro' ? 'sidebar-btn ativo' : 'sidebar-btn'}
          onClick={() => handleAcao(onIrCadastro)}
        >
          Cadastro
        </button>

        <button
          type="button"
          className={paginaAtual === 'healthcheck' ? 'sidebar-btn ativo' : 'sidebar-btn'}
          onClick={() => handleAcao(onIrHealthcheck)}
        >
          Health Check
        </button>

        {usuarioLogado && (
          <>
            <button
              type="button"
              className={paginaAtual === 'perfil' ? 'sidebar-btn ativo' : 'sidebar-btn'}
              onClick={() => handleAcao(onIrPerfil)}
            >
              Perfil
            </button>

            <button
              type="button"
              className="sidebar-btn sidebar-sair"
              onClick={() => handleAcao(onSair)}
            >
              Sair
            </button>
          </>
        )}
      </aside>
    </>
  )
}

export default Sidebar