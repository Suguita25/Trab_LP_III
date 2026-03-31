from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import FotoPostada, Usuario
from .schemas import (
    FotoPostadaCreate,
    FotoPostadaResponse,
    UsuarioCreate,
    UsuarioListResponse,
    UsuarioLogin,
    UsuarioResponse,
    UsuarioUpdate,
    UsuarioVerificacaoUpdate,
)
from .services.face_matching import FaceMatchError, verificar_match_facial

app = FastAPI(title="Backend - Projeto Lab Prog III")

ORIGENS_VALIDAS_IMAGEM = {"camera", "galeria"}
TAMANHO_MAXIMO_FOTO_BASE64 = 7_000_000


Base.metadata.create_all(bind=engine)


def garantir_colunas_verificacao_usuario():
    inspector = inspect(engine)

    if "usuarios" not in inspector.get_table_names():
        return

    colunas_existentes = {
        coluna["name"] for coluna in inspector.get_columns("usuarios")
    }
    comandos = []

    if "foto_verificacao" not in colunas_existentes:
        comandos.append(
            "ALTER TABLE usuarios ADD COLUMN foto_verificacao TEXT"
        )

    if "verificacao_status" not in colunas_existentes:
        comandos.append(
            "ALTER TABLE usuarios ADD COLUMN verificacao_status "
            "VARCHAR(30) NOT NULL DEFAULT 'nao_enviado'"
        )

    if "verificacao_origem_foto" not in colunas_existentes:
        comandos.append(
            "ALTER TABLE usuarios ADD COLUMN verificacao_origem_foto "
            "VARCHAR(30)"
        )

    if "verificacao_data_envio" not in colunas_existentes:
        comandos.append(
            "ALTER TABLE usuarios ADD COLUMN verificacao_data_envio "
            "TIMESTAMP WITH TIME ZONE"
        )

    with engine.begin() as conexao:
        for comando in comandos:
            conexao.execute(text(comando))

        if "verificacao_status" in colunas_existentes or comandos:
            conexao.execute(
                text(
                    "UPDATE usuarios "
                    "SET verificacao_status = 'nao_enviado' "
                    "WHERE verificacao_status IS NULL"
                )
            )


garantir_colunas_verificacao_usuario()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def validar_dados_imagem(
    foto_base64: str,
    origem: str,
    detalhe_sem_foto: str,
):
    if not foto_base64 or not origem:
        raise HTTPException(
            status_code=400,
            detail=detalhe_sem_foto,
        )

    if origem not in ORIGENS_VALIDAS_IMAGEM:
        raise HTTPException(
            status_code=400,
            detail="Origem da foto invalida",
        )

    if not foto_base64.startswith("data:image/") or ";base64," not in foto_base64:
        raise HTTPException(
            status_code=400,
            detail="A foto precisa ser uma imagem valida",
        )

    if len(foto_base64) > TAMANHO_MAXIMO_FOTO_BASE64:
        raise HTTPException(
            status_code=400,
            detail="A foto excede o limite permitido",
        )


def existe_outro_usuario_com_email(
    db: Session,
    email: str,
    usuario_id_atual: int | None = None,
):
    consulta = db.query(Usuario).filter(Usuario.email == email)

    if usuario_id_atual is not None:
        consulta = consulta.filter(Usuario.id != usuario_id_atual)

    return consulta.first() is not None


def buscar_usuario_ou_404(db: Session, usuario_id: int):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    return usuario


@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}


@app.post("/cadastro", response_model=UsuarioResponse)
def cadastro(dados: UsuarioCreate, db: Session = Depends(get_db)):
    if existe_outro_usuario_com_email(db, dados.email):
        raise HTTPException(
            status_code=400,
            detail="E-mail ja cadastrado",
        )

    validar_dados_imagem(
        dados.foto_verificacao,
        dados.verificacao_origem_foto,
        "Envie uma foto de verificacao usando a camera ou a galeria",
    )

    novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha=dados.senha,
        foto_verificacao=dados.foto_verificacao,
        verificacao_status="em_analise",
        verificacao_origem_foto=dados.verificacao_origem_foto,
        verificacao_data_envio=datetime.now(timezone.utc),
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@app.post("/login")
def login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.email == dados.email,
        Usuario.senha == dados.senha,
    ).first()

    if usuario:
        return {
            "mensagem": "Login realizado com sucesso",
            "usuario": usuario.nome,
        }

    raise HTTPException(
        status_code=401,
        detail="Email ou senha invalidos",
    )


@app.get("/usuarios", response_model=list[UsuarioListResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@app.get("/usuarios/email/{email}", response_model=UsuarioResponse)
def buscar_usuario_por_email(email: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    return usuario


@app.get("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return buscar_usuario_ou_404(db, usuario_id)


@app.put("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioUpdate,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario_ou_404(db, usuario_id)

    if existe_outro_usuario_com_email(db, dados.email, usuario_id):
        raise HTTPException(status_code=400, detail="E-mail ja cadastrado")

    usuario.nome = dados.nome
    usuario.email = dados.email
    usuario.senha = dados.senha

    db.commit()
    db.refresh(usuario)

    return usuario


@app.post("/usuarios/{usuario_id}/verificacao", response_model=UsuarioResponse)
def atualizar_verificacao_usuario(
    usuario_id: int,
    dados: UsuarioVerificacaoUpdate,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario_ou_404(db, usuario_id)

    validar_dados_imagem(
        dados.foto_verificacao,
        dados.verificacao_origem_foto,
        "Envie uma foto de verificacao usando a camera ou a galeria",
    )

    usuario.foto_verificacao = dados.foto_verificacao
    usuario.verificacao_status = "em_analise"
    usuario.verificacao_origem_foto = dados.verificacao_origem_foto
    usuario.verificacao_data_envio = datetime.now(timezone.utc)

    db.commit()
    db.refresh(usuario)

    return usuario


@app.get("/usuarios/{usuario_id}/fotos", response_model=list[FotoPostadaResponse])
def listar_fotos_usuario(usuario_id: int, db: Session = Depends(get_db)):
    buscar_usuario_ou_404(db, usuario_id)

    return (
        db.query(FotoPostada)
        .filter(FotoPostada.usuario_id == usuario_id)
        .order_by(FotoPostada.data_postagem.desc())
        .all()
    )


@app.post("/usuarios/{usuario_id}/fotos", response_model=FotoPostadaResponse)
def postar_foto_usuario(
    usuario_id: int,
    dados: FotoPostadaCreate,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario_ou_404(db, usuario_id)

    if not usuario.foto_verificacao:
        raise HTTPException(
            status_code=400,
            detail=(
                "O usuario precisa concluir a verificacao de identidade "
                "antes de postar fotos"
            ),
        )

    validar_dados_imagem(
        dados.foto,
        dados.origem_foto,
        "Envie a foto que deseja postar usando a camera ou a galeria",
    )

    try:
        resultado_match = verificar_match_facial(
            usuario.foto_verificacao,
            dados.foto,
        )
    except FaceMatchError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not resultado_match["verificado"]:
        raise HTTPException(
            status_code=403,
            detail=(
                "O rosto da foto nao corresponde a identidade verificada. "
                "A postagem foi bloqueada."
            ),
        )

    nova_foto = FotoPostada(
        usuario_id=usuario_id,
        foto=dados.foto,
        origem_foto=dados.origem_foto,
        data_postagem=datetime.now(timezone.utc),
        modelo_match=resultado_match["modelo"],
        detector_match=resultado_match["detector"],
        distancia_match=resultado_match["distancia"],
        limiar_match=resultado_match["limiar"],
    )

    db.add(nova_foto)
    db.commit()
    db.refresh(nova_foto)

    return nova_foto


@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = buscar_usuario_ou_404(db, usuario_id)

    db.delete(usuario)
    db.commit()

    return {"mensagem": "Usuario removido com sucesso"}
