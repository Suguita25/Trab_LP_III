from datetime import datetime, timezone

from .database import Base, SessionLocal, engine
from .models import Badge, TuristicPoint

BADGES_INICIAIS = [
    {
        "nome": "Explorador Iniciante",
        "descricao": "Conquista liberada ao acumular os primeiros 20 pontos.",
        "pontos_minimos": 20,
        "ativo": True,
    },
    {
        "nome": "Roteiro Carioca",
        "descricao": "Conquista liberada ao acumular 50 pontos em visitas.",
        "pontos_minimos": 50,
        "ativo": True,
    },
    {
        "nome": "Lenda Exerion",
        "descricao": "Conquista liberada ao acumular 100 pontos no mapa.",
        "pontos_minimos": 100,
        "ativo": True,
    },
]

PONTOS_TURISTICOS_INICIAIS = [
    {
        "nome": "Cristo Redentor",
        "descricao": "Monumento icônico com vista panorâmica da cidade.",
        "latitude": -22.9519,
        "longitude": -43.2105,
        "raio_desbloqueio": 180,
        "pontos_valor": 30,
    },
    {
        "nome": "Pão de Açúcar",
        "descricao": "Cartão-postal com trilha, bondinho e vista da baía.",
        "latitude": -22.9486,
        "longitude": -43.1566,
        "raio_desbloqueio": 180,
        "pontos_valor": 25,
    },
    {
        "nome": "Escadaria Selarón",
        "descricao": "Escadaria artística entre Lapa e Santa Teresa.",
        "latitude": -22.9153,
        "longitude": -43.1799,
        "raio_desbloqueio": 120,
        "pontos_valor": 20,
    },
    {
        "nome": "Arcos da Lapa",
        "descricao": "Ponto histórico e cultural no centro do Rio de Janeiro.",
        "latitude": -22.9138,
        "longitude": -43.1794,
        "raio_desbloqueio": 150,
        "pontos_valor": 15,
    },
]


def seed_badges(db):
    badges_criadas = 0

    for badge_data in BADGES_INICIAIS:
        badge = db.query(Badge).filter(Badge.nome == badge_data["nome"]).first()

        if badge is None:
            badge = Badge(
                criada_em=datetime.now(timezone.utc),
                **badge_data,
            )
            db.add(badge)
            badges_criadas += 1
            continue

        badge.descricao = badge_data["descricao"]
        badge.pontos_minimos = badge_data["pontos_minimos"]
        badge.ativo = badge_data["ativo"]

    return badges_criadas


def seed_pontos_turisticos(db):
    pontos_criados = 0

    for ponto_data in PONTOS_TURISTICOS_INICIAIS:
        ponto = (
            db.query(TuristicPoint)
            .filter(TuristicPoint.nome == ponto_data["nome"])
            .first()
        )

        if ponto is None:
            ponto = TuristicPoint(
                criado_em=datetime.now(timezone.utc),
                **ponto_data,
            )
            db.add(ponto)
            pontos_criados += 1
            continue

        ponto.descricao = ponto_data["descricao"]
        ponto.latitude = ponto_data["latitude"]
        ponto.longitude = ponto_data["longitude"]
        ponto.raio_desbloqueio = ponto_data["raio_desbloqueio"]
        ponto.pontos_valor = ponto_data["pontos_valor"]

    return pontos_criados


def main():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        badges_criadas = seed_badges(db)
        pontos_criados = seed_pontos_turisticos(db)
        db.commit()

    print(
        "Seed concluido: "
        f"{badges_criadas} badge(s) criada(s) e "
        f"{pontos_criados} ponto(s) turistico(s) criado(s)."
    )


if __name__ == "__main__":
    main()
