const originalValue: Record<string, () => any> = {};
const patches: Record<string, { factory: () => any; value: any }> = {};

const noFactory = () => {};

global.__jsMockStubHook = (
  patchId: string,
  originalImplementation: () => any
) => {
  const patch = patches[patchId];
  if (!patch) {
    if (!originalValue[patchId]) {
      originalValue[patchId] = originalImplementation();
    }
    return originalValue[patchId];
  }
  if (patch.factory !== noFactory) {
    patch.value = patch.factory();
    patch.factory = noFactory;
  }
  return patch.value;
};

export function __patch(filepath: string, varpath: string, factory: () => any) {
  const key = getKey(filepath, varpath);
  patches[key] = { factory, value: null };
  return () => {
    delete patches[key];
  };
}

export function getKey(filepath: string, varpath: string) {
  return `${filepath}|${varpath}`;
}
