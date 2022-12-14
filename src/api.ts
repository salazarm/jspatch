const patches: Record<string, { factory: (originalImpl: () => any) => any }> =
  {};

(global as any).__jsPatchHook = (
  nodeId: string,
  originalImplementation: () => any
) => {
  const patch = patches[nodeId];
  if (!patch) {
    return originalImplementation();
  }
  return patch.factory(originalImplementation);
};

(global as any).__jsPatchIdToNodes = (global as any).__jsPatchIdToNodes || {};

function __patch(
  filepath: string,
  varpath: string,
  factory: (originalImplementation: () => any) => any
) {
  const patchId = getKey(filepath, varpath);
  const nodesToPatch = (global as any).__jsPatchIdToNodes[patchId];
  const obj = { factory };
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

/**
 *
 * Strategy 1: Local temp variable
 * Strategy 2: Have funcitons bypass each other and reference the real "originalImplementation"?
 *
 */
