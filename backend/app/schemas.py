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
    pontos_totais: int

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

class TuristicPointResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None = None
    latitude: float
    longitude: float
    raio_desbloqueio: float
    pontos_valor: int
    criado_em: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None = None
    pontos_minimos: int
    ativo: bool
    criada_em: datetime

    class Config:
        from_attributes = True


class DesbloqueioPontoResponse(BaseModel):
    mensagem: str
    ponto_id: int
    ponto_nome: str
    distancia: float
    pontos_ganhos: int
    pontos_totais_usuario: int
    badge: str | None = None

class DesbloqueioPontoCreate(BaseModel):
    foto: str
    origem_foto: str
    latitude_usuario: float
    longitude_usuario: float

class UsuarioDesbloqueiosResponse(BaseModel):
    usuario_id: int
    pontos_desbloqueados: list[int]
