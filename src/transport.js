// src/transport.js
export function createHeadlessTransport(auth) {
  return {
    getConfig: () => auth.loadConfig(),
    selectSocial: async (provider) => { await auth.login(provider); return { navigateTo: null }; },
    selectEmail: async () => { await auth.login(); return { navigateTo: null }; },
  };
}
