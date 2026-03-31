from base64 import b64decode
from io import BytesIO
from os import remove
from tempfile import NamedTemporaryFile

from PIL import Image, ImageOps

TOLERANCIA_MATCH = 0.6
MODELO_MATCH = "face_recognition_dlib"
DETECTOR_MATCH = "hog"


class FaceMatchError(Exception):
    pass


def salvar_imagem_temporaria(foto_base64: str):
    try:
        cabecalho, conteudo = foto_base64.split(",", 1)
    except ValueError as exc:
        raise FaceMatchError("Formato de imagem invalido para o matching") from exc

    try:
        imagem_bytes = b64decode(conteudo)
        with Image.open(BytesIO(imagem_bytes)) as imagem_original:
            imagem = ImageOps.exif_transpose(imagem_original)

            if imagem.mode not in ("RGB", "L"):
                imagem = imagem.convert("RGB")
            elif imagem.mode == "L":
                imagem = imagem.convert("RGB")

            with NamedTemporaryFile(delete=False, suffix=".jpg") as arquivo_temporario:
                imagem.save(arquivo_temporario, format="JPEG", quality=95)
                return arquivo_temporario.name
    except Exception as exc:
        raise FaceMatchError(
            "Nao foi possivel preparar a imagem para o matching facial"
        ) from exc


def extrair_encoding(face_recognition, caminho_imagem: str):
    try:
        imagem = face_recognition.load_image_file(caminho_imagem)
        localizacoes = face_recognition.face_locations(
            imagem,
            model=DETECTOR_MATCH,
        )
    except Exception as exc:
        raise FaceMatchError(
            "Falha ao ler a imagem para o matching facial"
        ) from exc

    if not localizacoes:
        raise FaceMatchError(
            "Nao foi possivel detectar um rosto valido em uma das fotos. "
            "Use imagens frontais e bem iluminadas."
        )

    if len(localizacoes) > 1:
        raise FaceMatchError(
            "Use uma foto com apenas um rosto visivel para o matching"
        )

    encodings = face_recognition.face_encodings(
        imagem,
        known_face_locations=localizacoes,
        model="large",
    )

    if not encodings:
        raise FaceMatchError(
            "Nao foi possivel extrair a biometria facial de uma das fotos"
        )

    return encodings[0]


def verificar_match_facial(foto_referencia: str, foto_candidata: str):
    try:
        import face_recognition
    except BaseException as exc:
        raise FaceMatchError(
            "O servico de matching facial nao conseguiu ser inicializado no backend"
        ) from exc

    caminho_referencia = salvar_imagem_temporaria(foto_referencia)
    caminho_candidata = salvar_imagem_temporaria(foto_candidata)

    try:
        encoding_referencia = extrair_encoding(face_recognition, caminho_referencia)
        encoding_candidata = extrair_encoding(face_recognition, caminho_candidata)

        verificado = bool(
            face_recognition.compare_faces(
                [encoding_referencia],
                encoding_candidata,
                tolerance=TOLERANCIA_MATCH,
            )[0]
        )
        distancia = float(
            face_recognition.face_distance(
                [encoding_referencia],
                encoding_candidata,
            )[0]
        )
    except FaceMatchError:
        raise
    except Exception as exc:
        raise FaceMatchError(
            "Falha ao executar o matching facial no backend"
        ) from exc
    finally:
        for caminho in (caminho_referencia, caminho_candidata):
            try:
                remove(caminho)
            except OSError:
                pass

    return {
        "verificado": verificado,
        "modelo": MODELO_MATCH,
        "detector": DETECTOR_MATCH,
        "distancia": distancia,
        "limiar": TOLERANCIA_MATCH,
    }
