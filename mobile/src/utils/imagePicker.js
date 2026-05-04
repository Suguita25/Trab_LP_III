import * as ImagePicker from "expo-image-picker";

export async function selecionarImagemComPermissao(
  origin,
  {
    cameraDeniedMessage = "Permita o acesso a camera para continuar.",
    galleryDeniedMessage = "Permita o acesso a galeria para continuar.",
  } = {}
) {
  if (origin === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new Error(cameraDeniedMessage);
    }

    return ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
      mediaTypes: ["images"],
      quality: 0.55,
    });
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(galleryDeniedMessage);
  }

  return ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    base64: true,
    mediaTypes: ["images"],
    quality: 0.55,
  });
}
