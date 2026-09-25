import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type AvatarSource = 'library' | 'camera';

export class CameraPermissionError extends Error {}

/**
 * Let the user pick or take a square photo. Resolves to null if they cancel.
 * Compatible mode makes iOS hand back a JPEG instead of HEIC, which the API and browsers accept.
 */
export async function pickAvatar(source: AvatarSource): Promise<ImagePicker.ImagePickerAsset | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  };

  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new CameraPermissionError('Allow camera access in Settings to take a photo.');
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  return result.canceled ? null : (result.assets[0] ?? null);
}

/** Wrap a picked photo as the multipart body POST /user/avatar expects. */
export async function avatarForm(asset: ImagePicker.ImagePickerAsset): Promise<FormData> {
  const type = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `avatar.${type.split('/')[1] ?? 'jpg'}`;
  const form = new FormData();

  if (Platform.OS === 'web') {
    // Browsers need a real Blob; the picker gives a File, or a blob:/data: URI we can fetch.
    const blob = asset.file ?? (await (await fetch(asset.uri)).blob());
    form.append('avatar', blob, name);
  } else {
    // React Native's FormData uploads a local file from { uri, name, type }.
    form.append('avatar', { uri: asset.uri, name, type } as unknown as Blob);
  }

  return form;
}
