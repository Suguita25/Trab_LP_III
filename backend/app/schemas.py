from datetime import datetime

from pydantic import BaseModel, Field


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
    foto: str | None = None


class DesbloqueioPontoCreate(BaseModel):
    foto: str
    origem_foto: str
    latitude_usuario: float
    longitude_usuario: float


class ValidacaoProximidadeCreate(BaseModel):
    latitude_usuario: float
    longitude_usuario: float


class ValidacaoProximidadeResponse(BaseModel):
    ponto_id: int
    ponto_nome: str
    dentro_do_raio: bool
    distancia: float
    raio_desbloqueio: float


class DesbloqueioPontoUsuarioResponse(BaseModel):
    id: int
    ponto_id: int
    ponto_nome: str
    foto: str
    data_desbloqueio: datetime


class UsuarioDesbloqueiosResponse(BaseModel):
    usuario_id: int
    pontos_desbloqueados: list[int]
    desbloqueios: list[DesbloqueioPontoUsuarioResponse] = Field(
        default_factory=list
    )


class MatchFotoLocalResponse(BaseModel):
    ponto_id: int
    ponto_nome: str
    foto_usuario_origem: str | None = None
    foto_usuario_destino: str | None = None
    data_usuario_origem: datetime | None = None
    data_usuario_destino: datetime | None = None


class MatchFotoUsuarioResponse(BaseModel):
    id: int
    foto: str
    data_postagem: datetime


class MatchRecommendationResponse(BaseModel):
    usuario_destino_id: int
    usuario_destino_nome: str
    quantidade_locais_em_comum: int
    score_afinidade: float
    status: str
    locais_em_comum: list[str]
    fotos_usuario_destino: list[MatchFotoUsuarioResponse] = Field(
        default_factory=list
    )
    fotos_locais_em_comum: list[MatchFotoLocalResponse] = Field(
        default_factory=list
    )

    class Config:
        from_attributes = True


class MatchDetailResponse(MatchRecommendationResponse):
    usuario_origem_id: int
    total_locais_usuario_origem: int
    total_locais_usuario_destino: int


class MatchInteractionResponse(MatchRecommendationResponse):
    id: int | None = None
    atualizado_em: datetime | None = None

    class Config:
        from_attributes = True


class MatchActionResponse(BaseModel):
    mensagem: str
    match: MatchInteractionResponse
