import { number } from "yargs";

const originalImplementations: Record<string, () => any> = {};
const patches: Record<string, { factory: () => any; value: any }> = {};

const noFactory = () => {};

global.__jsMockStubHook = {
  register(patchId: string, originalImplementation: () => any) {
    originalImplementation[patchId] = originalImplementation;
    return {
      get() {
        const patch = patches[patchId];
        if (!patch) {
          return originalImplementations[patchId]();
        }
        if (patch.factory !== noFactory) {
          patch.value = patch.factory();
          patch.factory = noFactory;
        }
        return patch.value;
      },
    };
  },

  get(patchId: string) {},
};

export function __patch(filepath: string, varpath: string, factory: () => any) {
  const key = getKey(filepath, varpath);
  patches[key] = { factory, value: null };
  return () => {
    delete patches[key];
  };
}

function getKey(filepath: string, varpath: string) {
  return `${filepath}|${varpath}`;
}
