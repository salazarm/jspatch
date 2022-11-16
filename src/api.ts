const patches: Record<string, { factory: () => any; value: any }> = {};

(global as any).__jsMockStubHook = (
  nodeId: string,
  originalImplementation: () => any
) => {
  const patch = patches[nodeId];
  if (!patch) {
    return originalImplementation();
  }
  return patch.factory();
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
