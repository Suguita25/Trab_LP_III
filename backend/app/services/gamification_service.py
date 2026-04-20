#area dedicada a logica de gamification, como calculo de distancia, verificacao de proximidade do usuario
#raio mínimo: 100 metros (ver models.py)
from math import radians, sin, cos, sqrt, atan2


def calcular_distancia_metros(
    latitude_usuario: float,
    longitude_usuario: float,
    latitude_ponto: float,
    longitude_ponto: float,
) -> float:
    raio_terra = 6371000  # metros

    dlat = radians(latitude_ponto - latitude_usuario)
    dlon = radians(longitude_ponto - longitude_usuario)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(latitude_usuario))
        * cos(radians(latitude_ponto))
        * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return raio_terra * c


def usuario_esta_no_raio(
    latitude_usuario: float,
    longitude_usuario: float,
    latitude_ponto: float,
    longitude_ponto: float,
    raio_desbloqueio: float,
) -> tuple[bool, float]:
    distancia = calcular_distancia_metros(
        latitude_usuario=latitude_usuario,
        longitude_usuario=longitude_usuario,
        latitude_ponto=latitude_ponto,
        longitude_ponto=longitude_ponto,
    )

    return distancia <= raio_desbloqueio, distancia