/** The user's appearance choice in Profile: follow the phone, or always light or dark. */
export type AppearancePreference = 'system' | 'light' | 'dark';

export const appearanceOptions: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Read a saved choice; nothing saved (or anything unexpected) means follow the phone. */
export function parseAppearance(raw: string | null | undefined): AppearancePreference {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

/** The scheme to draw with: an explicit choice wins, otherwise the phone's setting (light when it reports none). */
export function resolveScheme(preference: AppearancePreference, system: string | null | undefined): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
