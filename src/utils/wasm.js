// WASM module loader
let wasmModule = null;
let initPromise = null;

export async function initWasm() {
  if (wasmModule) return wasmModule;

  if (!initPromise) {
    initPromise = (async () => {
      const wasm = await import('../../uesave-wasm/pkg/uesave_wasm.js');
      await wasm.default();
      wasmModule = wasm;
      return wasm;
    })();
  }

  return initPromise;
}

export async function convertSavToJson(bytes) {
  const wasm = await initWasm();
  return wasm.to_json(bytes);
}
