export function memoryTokenStore() {
  let tokens = null;
  return {
    get: () => tokens,
    set: (t) => { tokens = t; },
    clear: () => { tokens = null; },
  };
}
