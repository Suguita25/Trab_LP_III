from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import DesbloqueioPonto, Match, TuristicPoint, Usuario

MATCH_STATUS_SUGERIDO = "sugerido"
MATCH_STATUS_CURTIDO = "curtido"
MATCH_STATUS_IGNORADO = "ignorado"
MATCH_STATUS_VALIDOS = {
    MATCH_STATUS_SUGERIDO,
    MATCH_STATUS_CURTIDO,
    MATCH_STATUS_IGNORADO,
}


@dataclass
class CompatibilidadeMatch:
    usuario_origem_id: int
    usuario_destino_id: int
    usuario_destino_nome: str
    quantidade_locais_em_comum: int
    score_afinidade: float
    status: str
    locais_em_comum: list[str]
    total_locais_usuario_origem: int
    total_locais_usuario_destino: int

    def para_recomendacao(self):
        return {
            "usuario_destino_id": self.usuario_destino_id,
            "usuario_destino_nome": self.usuario_destino_nome,
            "quantidade_locais_em_comum": self.quantidade_locais_em_comum,
            "score_afinidade": self.score_afinidade,
            "status": self.status,
            "locais_em_comum": self.locais_em_comum,
        }

    def para_detalhe(self):
        return {
            "usuario_origem_id": self.usuario_origem_id,
            "usuario_destino_id": self.usuario_destino_id,
            "usuario_destino_nome": self.usuario_destino_nome,
            "quantidade_locais_em_comum": self.quantidade_locais_em_comum,
            "score_afinidade": self.score_afinidade,
            "status": self.status,
            "locais_em_comum": self.locais_em_comum,
            "total_locais_usuario_origem": self.total_locais_usuario_origem,
            "total_locais_usuario_destino": self.total_locais_usuario_destino,
        }

    def para_interacao(self, match_id: int | None, atualizado_em):
        return {
            "id": match_id,
            "usuario_destino_id": self.usuario_destino_id,
            "usuario_destino_nome": self.usuario_destino_nome,
            "quantidade_locais_em_comum": self.quantidade_locais_em_comum,
            "score_afinidade": self.score_afinidade,
            "status": self.status,
            "locais_em_comum": self.locais_em_comum,
            "atualizado_em": atualizado_em,
        }


def _buscar_locais_por_usuario(db: Session):
    resultados = (
        db.query(
            DesbloqueioPonto.usuario_id,
            TuristicPoint.id,
            TuristicPoint.nome,
        )
        .join(TuristicPoint, TuristicPoint.id == DesbloqueioPonto.ponto_id)
        .all()
    )

    locais_por_usuario = defaultdict(dict)

    for usuario_id, ponto_id, ponto_nome in resultados:
        locais_por_usuario[usuario_id][ponto_id] = ponto_nome

    return locais_por_usuario


def _buscar_matches_por_origem(db: Session, usuario_id: int):
    matches = (
        db.query(Match)
        .filter(Match.usuario_origem_id == usuario_id)
        .all()
    )

    return {
        match.usuario_destino_id: match for match in matches
    }


def _calcular_score_afinidade(
    locais_origem: dict[int, str],
    locais_destino: dict[int, str],
    quantidade_locais_em_comum: int,
):
    if quantidade_locais_em_comum <= 0:
        return 0.0

    total_locais_unicos = len(set(locais_origem) | set(locais_destino))

    if total_locais_unicos == 0:
        return 0.0

    return round((quantidade_locais_em_comum / total_locais_unicos) * 100, 2)


def _montar_compatibilidade(
    usuario_origem_id: int,
    usuario_destino: Usuario,
    locais_origem: dict[int, str],
    locais_destino: dict[int, str],
    status: str,
):
    locais_em_comum_ids = set(locais_origem) & set(locais_destino)
    locais_em_comum = sorted(
        {
            locais_origem[ponto_id]
            for ponto_id in locais_em_comum_ids
        }
    )

    quantidade_locais_em_comum = len(locais_em_comum_ids)
    score_afinidade = _calcular_score_afinidade(
        locais_origem,
        locais_destino,
        quantidade_locais_em_comum,
    )

    return CompatibilidadeMatch(
        usuario_origem_id=usuario_origem_id,
        usuario_destino_id=usuario_destino.id,
        usuario_destino_nome=usuario_destino.nome,
        quantidade_locais_em_comum=quantidade_locais_em_comum,
        score_afinidade=score_afinidade,
        status=status,
        locais_em_comum=locais_em_comum,
        total_locais_usuario_origem=len(locais_origem),
        total_locais_usuario_destino=len(locais_destino),
    )


def listar_recomendacoes_match(db: Session, usuario_id: int):
    locais_por_usuario = _buscar_locais_por_usuario(db)
    locais_origem = locais_por_usuario.get(usuario_id, {})

    if not locais_origem:
        return []

    matches_existentes = _buscar_matches_por_origem(db, usuario_id)
    usuarios = (
        db.query(Usuario)
        .filter(Usuario.id != usuario_id)
        .order_by(Usuario.nome.asc())
        .all()
    )

    recomendacoes = []

    for usuario in usuarios:
        match_existente = matches_existentes.get(usuario.id)
        status_atual = (
            match_existente.status
            if match_existente
            else MATCH_STATUS_SUGERIDO
        )

        if status_atual != MATCH_STATUS_SUGERIDO:
            continue

        compatibilidade = _montar_compatibilidade(
            usuario_origem_id=usuario_id,
            usuario_destino=usuario,
            locais_origem=locais_origem,
            locais_destino=locais_por_usuario.get(usuario.id, {}),
            status=status_atual,
        )

        if compatibilidade.quantidade_locais_em_comum <= 0:
            continue

        recomendacoes.append(compatibilidade)

    recomendacoes.sort(
        key=lambda item: (
            -item.quantidade_locais_em_comum,
            -item.score_afinidade,
            item.usuario_destino_nome.lower(),
        )
    )

    return [item.para_recomendacao() for item in recomendacoes]


def obter_detalhes_match(
    db: Session,
    usuario_id: int,
    outro_usuario_id: int,
):
    usuario_destino = (
        db.query(Usuario)
        .filter(Usuario.id == outro_usuario_id)
        .first()
    )

    if not usuario_destino:
        raise ValueError("Usuario de destino nao encontrado")

    locais_por_usuario = _buscar_locais_por_usuario(db)
    matches_existentes = _buscar_matches_por_origem(db, usuario_id)
    match_existente = matches_existentes.get(outro_usuario_id)

    compatibilidade = _montar_compatibilidade(
        usuario_origem_id=usuario_id,
        usuario_destino=usuario_destino,
        locais_origem=locais_por_usuario.get(usuario_id, {}),
        locais_destino=locais_por_usuario.get(outro_usuario_id, {}),
        status=(
            match_existente.status
            if match_existente
            else MATCH_STATUS_SUGERIDO
        ),
    )

    return compatibilidade.para_detalhe()


def registrar_interacao_match(
    db: Session,
    usuario_id: int,
    outro_usuario_id: int,
    status: str,
):
    if status not in MATCH_STATUS_VALIDOS or status == MATCH_STATUS_SUGERIDO:
        raise ValueError("Status de interacao invalido")

    detalhe_match = obter_detalhes_match(db, usuario_id, outro_usuario_id)

    if detalhe_match["quantidade_locais_em_comum"] <= 0:
        raise ValueError(
            "Nao existem locais em comum suficientes para registrar essa interacao"
        )

    match_existente = (
        db.query(Match)
        .filter(
            Match.usuario_origem_id == usuario_id,
            Match.usuario_destino_id == outro_usuario_id,
        )
        .first()
    )

    agora = datetime.now(timezone.utc)

    if match_existente:
        match_existente.score_afinidade = detalhe_match["score_afinidade"]
        match_existente.status = status
        match_existente.atualizado_em = agora
    else:
        match_existente = Match(
            usuario_origem_id=usuario_id,
            usuario_destino_id=outro_usuario_id,
            score_afinidade=detalhe_match["score_afinidade"],
            status=status,
            criado_em=agora,
            atualizado_em=agora,
        )
        db.add(match_existente)

    db.commit()
    db.refresh(match_existente)

    detalhe_match["status"] = match_existente.status

    return {
        "id": match_existente.id,
        "usuario_destino_id": detalhe_match["usuario_destino_id"],
        "usuario_destino_nome": detalhe_match["usuario_destino_nome"],
        "quantidade_locais_em_comum": detalhe_match["quantidade_locais_em_comum"],
        "score_afinidade": detalhe_match["score_afinidade"],
        "status": detalhe_match["status"],
        "locais_em_comum": detalhe_match["locais_em_comum"],
        "atualizado_em": match_existente.atualizado_em,
    }


def listar_interacoes_match(db: Session, usuario_id: int):
    matches = (
        db.query(Match)
        .filter(Match.usuario_origem_id == usuario_id)
        .order_by(Match.atualizado_em.desc())
        .all()
    )

    if not matches:
        return []

    locais_por_usuario = _buscar_locais_por_usuario(db)
    locais_origem = locais_por_usuario.get(usuario_id, {})
    usuarios_destino_ids = [match.usuario_destino_id for match in matches]
    usuarios_destino = (
        db.query(Usuario)
        .filter(Usuario.id.in_(usuarios_destino_ids))
        .all()
    )
    usuarios_destino_por_id = {
        usuario.id: usuario for usuario in usuarios_destino
    }

    interacoes = []

    for match in matches:
        usuario_destino = usuarios_destino_por_id.get(match.usuario_destino_id)

        if not usuario_destino:
            continue

        compatibilidade = _montar_compatibilidade(
            usuario_origem_id=usuario_id,
            usuario_destino=usuario_destino,
            locais_origem=locais_origem,
            locais_destino=locais_por_usuario.get(usuario_destino.id, {}),
            status=match.status,
        )

        interacoes.append(
            compatibilidade.para_interacao(match.id, match.atualizado_em)
        )

    return interacoes
