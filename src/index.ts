const originalValue: Record<string, () => any> = {};
const patches: Record<string, { factory: () => any; value: any }> = {};

const noFactory = () => {};

global.__jsMockStubHook = (
  nodeId: string,
  originalImplementation: () => any
) => {
  const patch = patches[nodeId];
  if (!patch) {
    if (!originalValue[nodeId]) {
      originalValue[nodeId] = originalImplementation();
    }
    return originalValue[nodeId];
  }
  if (patch.factory !== noFactory) {
    patch.value = patch.factory();
    patch.factory = noFactory;
  }
  return patch.value;
};

global.__jsMockPatchIdToNodes = global.__jsMockPatchIdToNodes || {};

export function __patch(filepath: string, varpath: string, factory: () => any) {
  const patchId = getKey(filepath, varpath);
  const nodesToPatch = global.__jsMockPatchIdToNodes[patchId];
  const obj = { factory, value: null };
  if (nodesToPatch) {
    nodesToPatch.forEach((nodeId) => {
      patches[nodeId] = obj;
    });
  }
  return () => {
    if (nodesToPatch) {
      nodesToPatch.forEach((nodeId) => {
        delete patches[nodeId];
      });
    }
  };
}

export function getKey(filepath: string, varpath: string) {
  return `${filepath}|${varpath}`;
}
