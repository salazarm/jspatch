/**
 * This is a stub that will be converted into an AST to be inserted at
 * locations that we want to be able to dynamically patch"
 *
 */
export default function __MAIN__() {
  (function () {
    const patchId = "{PATCH_ID}"; // eg: classIdentifier.classMethodIdentifier.arbitraryIdentifier (Storage.getItem.postgres)

    // Pass a getter so that we can use the original implementation lazily only if its needed.
    const hook = (global as any).__jsMockStubHook(
      patchId,
      () => "{ORIGINAL_IMPLEMENTATION_PLACEHOLDER}"
    );
    return hook.get();
  })();
}
