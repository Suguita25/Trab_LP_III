from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import Usuario
from .schemas import UsuarioCreate, UsuarioLogin, UsuarioUpdate, UsuarioResponse

app = FastAPI(title="Backend - Projeto Lab Prog III")

# cria as tabelas no banco
Base.metadata.create_all(bind=engine)

# dependência para abrir/fechar sessão com o banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# healthcheck
@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

# cadastro
@app.post("/cadastro", response_model=UsuarioResponse)
def cadastro(dados: UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(Usuario).filter(Usuario.email == dados.email).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado"
        )

    novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha=dados.senha
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario

# login
@app.post("/login")
def login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.email == dados.email,
        Usuario.senha == dados.senha
    ).first()

    if usuario:
        return {
            "mensagem": "Login realizado com sucesso",
            "usuario": usuario.nome
        }

    raise HTTPException(
        status_code=401,
        detail="Email ou senha inválidos"
    )

# listar usuários
@app.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

# buscar usuário por id
@app.get("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return usuario

# atualizar usuário
@app.put("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(usuario_id: int, dados: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    usuario.nome = dados.nome
    usuario.email = dados.email
    usuario.senha = dados.senha

    db.commit()
    db.refresh(usuario)

    return usuario

# deletar usuário
@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    db.delete(usuario)
    db.commit()

    return {"mensagem": "Usuário removido com sucesso"}