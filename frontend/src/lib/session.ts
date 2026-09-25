export type RestoredSession<U> =
  | { status: 'signed-in'; user: U }
  | { status: 'signed-out' }
  | { status: 'unreachable'; error: unknown };

/**
 * Check a saved sign-in with the server on launch. Only a 401 means the sign-in is no longer valid;
 * no signal, a server error or anything else keeps it, so opening the app offline doesn't sign the user out.
 */
export async function restoreSession<U>(token: string | null, loadUser: () => Promise<U>): Promise<RestoredSession<U>> {
  if (!token) return { status: 'signed-out' };
  try {
    return { status: 'signed-in', user: await loadUser() };
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    return status === 401 ? { status: 'signed-out' } : { status: 'unreachable', error };
  }
}
