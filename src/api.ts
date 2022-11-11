const originalValue: Record<string, () => any> = {};
const patches: Record<string, { factory: () => any; value: any }> = {};

const noFactory = () => {};

(global as any).__jsMockStubHook = (
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

(global as any).__jsMockPatchIdToNodes =
  (global as any).__jsMockPatchIdToNodes || {};

function __patch(filepath: string, varpath: string, factory: () => any) {
  const patchId = getKey(filepath, varpath);
  const nodesToPatch = (global as any).__jsMockPatchIdToNodes[patchId];
  const obj = { factory, value: null };
  if (nodesToPatch) {
    nodesToPatch.forEach((nodeId: string) => {
      patches[nodeId] = obj;
    });
  }
  return () => {
    if (nodesToPatch) {
      nodesToPatch.forEach((nodeId: string) => {
        delete patches[nodeId];
      });
    }
  };
}

function getKey(filepath: string, varpath: string) {
  return `${filepath}|${varpath}`;
}

export default {
  __patch,
};
