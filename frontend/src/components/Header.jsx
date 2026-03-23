import logo from '../assets/exerion_logo.png'

function Header({ titulo, onAbrirSidebar }) {
  return (
    <header className="header">
      <div className="header-esquerda">
        <img src={logo} alt="Logo do sistema" className="header-logo" />

        <div>
          <h2 className="header-titulo">Exerion</h2>
          <p className="header-subtitulo">{titulo}</p>
        </div>
      </div>

      <button
        type="button"
        className="header-menu-btn"
        onClick={onAbrirSidebar}
      >
        ☰ Menu
      </button>
    </header>
  )
}

export default Header