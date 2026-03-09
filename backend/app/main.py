from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Backend - Projeto Lab Prog III")

# Checagem de status
@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

# Autenticação
usuarios = []

# Cadastro
class CadastroRequest(BaseModel):
    email: str
    nome: str
    senha: str

@app.post("/cadastro")
def cadastro(dados: CadastroRequest):
    for usuario in usuarios:
        if usuario["email"] == dados.email:
            raise HTTPException(
                status_code=400,
                detail="E-mail já cadastrado"
            )
    novo_usuario = {
        "email": dados.email,
        "nome": dados.nome,
        "senha": dados.senha
    }

    usuarios.append(novo_usuario)

    return {
        "mensagem": "Usuário cadastrado com sucesso",
        "usuario": {
            "nome": dados.nome,
            "email": dados.email
        }
    }

# Login
class LoginRequest(BaseModel):
    email: str
    senha: str

@app.post("/login")
def login(dados: LoginRequest):
    for usuario in usuarios:
        if usuario["email"] == dados.email and usuario["senha"] == dados.senha:
            return {
                "mensagem": "Login realizado com sucesso",
                "usuario": usuario["nome"]
            }

    raise HTTPException(
        status_code=401,
        detail="Email ou senha inválidos"
    )