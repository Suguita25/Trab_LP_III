from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

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
