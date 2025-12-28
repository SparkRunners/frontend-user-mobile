import * as Keychain from 'react-native-keychain';

const SERVICE = 'spark-auth-token';

export const tokenStorage = {
  async save(token: string) {
    await Keychain.setGenericPassword('auth', token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  },
  async load() {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE });
    return credentials?.password ?? null;
  },
  async clear() {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
    } catch {
      // ignore missing entries
    }
  },
};
