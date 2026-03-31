from datetime import datetime

from pydantic import BaseModel


class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    foto_verificacao: str
    verificacao_origem_foto: str


class UsuarioLogin(BaseModel):
    email: str
    senha: str


class UsuarioUpdate(BaseModel):
    nome: str
    email: str
    senha: str


class UsuarioVerificacaoUpdate(BaseModel):
    foto_verificacao: str
    verificacao_origem_foto: str


class UsuarioListResponse(BaseModel):
    id: int
    nome: str
    email: str
    verificacao_status: str

    class Config:
        from_attributes = True


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    verificacao_status: str
    verificacao_origem_foto: str | None = None
    verificacao_data_envio: datetime | None = None
    foto_verificacao: str | None = None

    class Config:
        from_attributes = True


class FotoPostadaCreate(BaseModel):
    foto: str
    origem_foto: str


class FotoPostadaResponse(BaseModel):
    id: int
    usuario_id: int
    foto: str
    origem_foto: str
    data_postagem: datetime
    modelo_match: str
    detector_match: str
    distancia_match: float
    limiar_match: float

    class Config:
        from_attributes = True
