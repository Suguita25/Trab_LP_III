from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, Boolean, UniqueConstraint

from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    foto_verificacao = Column(Text, nullable=True)
    verificacao_status = Column(String, nullable=False, default="nao_enviado")
    verificacao_origem_foto = Column(String, nullable=True)
    verificacao_data_envio = Column(DateTime(timezone=True), nullable=True)
    pontos_totais = Column(Integer, nullable=False, default=0)


class FotoPostada(Base):
    __tablename__ = "fotos_postadas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    foto = Column(Text, nullable=False)
    origem_foto = Column(String, nullable=False)
    data_postagem = Column(DateTime(timezone=True), nullable=False)
    modelo_match = Column(String, nullable=False)
    detector_match = Column(String, nullable=False)
    distancia_match = Column(Float, nullable=False)
    limiar_match = Column(Float, nullable=False)


class TuristicPoint(Base):
    __tablename__ = "turistic_points"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    raio_desbloqueio = Column(Float, nullable=False, default=100)
    pontos_valor = Column(Integer, nullable=False, default=10)
    criado_em = Column(DateTime(timezone=True), nullable=False)


class DesbloqueioPonto(Base):
    __tablename__ = "desbloqueios_pontos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    ponto_id = Column(Integer, ForeignKey("turistic_points.id"), nullable=False, index=True)
    foto = Column(Text, nullable=False)
    latitude_usuario = Column(Float, nullable=False)
    longitude_usuario = Column(Float, nullable=False)
    distancia = Column(Float, nullable=False)
    pontos_ganhos = Column(Integer, nullable=False)
    data_desbloqueio = Column(DateTime(timezone=True), nullable=False)
    badge_desbloqueada_id = Column(Integer, ForeignKey("badges.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint("usuario_id", "ponto_id", name="uq_usuario_ponto"),
    )


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    usuario_origem_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    usuario_destino_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score_afinidade = Column(Float, nullable=False, default=0)
    status = Column(String, nullable=False, default="sugerido")
    criado_em = Column(DateTime(timezone=True), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "usuario_origem_id",
            "usuario_destino_id",
            name="uq_match_origem_destino",
        ),
    )


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    pontos_minimos = Column(Integer, nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)
    criada_em = Column(DateTime(timezone=True), nullable=False)
