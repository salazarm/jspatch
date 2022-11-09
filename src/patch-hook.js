/**
 * This is a stub that will be converted into an AST to be inserted at
 * locations that we want to be able to dynamically patch.
 *
 * Then at all callsites referencing this binding we will replace the
 *  node with a call to get the real value
 *
 */
export function __PATCH_FACTORY__() {
  (function () {
    const patchId = "{PATCH_ID}";

    // Pass a getter so that we can use the original implementation lazily only if its needed.
    const hook = global.__jsMockStubHook.register(
      patchId,
      () => "{ORIGINAL_IMPLEMENTATION_PLACEHOLDER}"
    );
    return hook;
  })();
}

/**
 * This is a stub that will be converted into an AST to be inserted at sites referencing the patched variable. We will redirect them to this patch.
 */
export function __PATCH_GETTER__() {
  global.__jsMockStubHook.get("{PATCH_VARIABLE_NAME}");
}
