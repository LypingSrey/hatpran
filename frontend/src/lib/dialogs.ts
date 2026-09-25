import { Alert, Platform } from 'react-native';

import { errorMessage } from './useApi';

/** Confirm on native; window.confirm on web where Alert buttons aren't supported. */
export function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** A one-button message, calling onClose once it's dismissed. */
export function notify(title: string, message: string, onClose?: () => void) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    onClose?.();
    return;
  }
  Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
}

export function showError(e: unknown) {
  const message = errorMessage(e);
  if (Platform.OS === 'web') globalThis.alert?.(message);
  else Alert.alert('Could not save', message);
}
