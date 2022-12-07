import api from "../api";
import { useGlobalHookUser, useGlobalHookUser2 } from "./example";

const { __patch } = api;

const notPatched = (name: string) => `${name} not patched!`;
const patchObj = "doesPatch.test.ts";

describe("Mock", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("can patch a value at the global scope", () => {
    const result1 = useGlobalHookUser();

    expect(result1).toEqual({
      hook: notPatched("GlobalHook"),
    });

    const unpatch = __patch(
      "src/tests/example",
      "useGlobalHook",
      () => () => patchObj
    );

    const result2 = useGlobalHookUser();
    expect(result2).toEqual({
      hook: patchObj,
    });

    const result3 = useGlobalHookUser2();
    expect(result3).toEqual({
      hook: patchObj,
    });

    unpatch();

    const result4 = useGlobalHookUser();
    expect(result4).toEqual({
      hook: notPatched("GlobalHook"),
    });
  });

  it("can patch a value at the local scope", () => {
    // useHook` is patched for useGlobalHookUser but useGlobalHookUser2 is unaffected
    const unpatch = __patch(
      "src/tests/example",
      "useGlobalHookUser.useGlobalHook",
      () => () => patchObj
    );

    let hook = useGlobalHookUser();
    expect(hook).toEqual({
      hook: patchObj,
    });

    hook = useGlobalHookUser2();
    expect(hook).toEqual({
      hook: notPatched("GlobalHook"),
    });

    unpatch();
  });

  it("can patch short hand property assignment", () => {
    const unpatch = __patch(
      "src/tests/example",
      "useGlobalHookUser.hook",
      () => patchObj
    );

    let hook = useGlobalHookUser();
    expect(hook).toEqual({
      hook: patchObj,
    });

    hook = useGlobalHookUser2();
    expect(hook).toEqual({
      hook: notPatched("GlobalHook"),
    });

    unpatch();
  });

  it("passes original implementation as an argument for monkey patching and doesnt load the code unless its called", () => {
    const unpatchGlobalHook = __patch(
      "src/tests/example",
      "useGlobalHook",
      (originalImplementation) => {
        ogImplementation = originalImplementation;
        return originalImplementation();
      }
    );
    let ogImplementation;
    let ogHookImplementation;

    const unpatch = __patch(
      "src/tests/example",
      "useGlobalHookUser.hook",
      (originalHookImplementation) => {
        return hookPatch(originalHookImplementation);
      }
    );

    // TODO: Make this behavior more sane
    let hookPatch = (originalHookImplementation) => {
      ogHookImplementation = originalHookImplementation;
      const value = originalHookImplementation();
      expect(value).toEqual(notPatched("GlobalHook"));

      hookPatch = hookPatch2;

      return patchObj;
    };

    let hookPatch2 = (originalImplementation) => {
      const value = originalImplementation();

      expect(value).toEqual(patchObj);

      return originalImplementation();
    };

    let hook = useGlobalHookUser();

    expect(hook).toEqual({
      hook: patchObj,
    });

    hook = useGlobalHookUser2();
    expect(hook).toEqual({
      hook: notPatched("GlobalHook"),
    });

    unpatch();
    unpatchGlobalHook();

    console.log("after unpatching");

    expect(ogImplementation()()).toEqual(notPatched("GlobalHook"));
  });

  it("can not patch exported identifiers in modules that are already loaded", () => {
    let useGlobalHookUser = require("./example").useGlobalHookUser;
    expect(useGlobalHookUser()).toEqual({ hook: notPatched("GlobalHook") });
    const unpatch = __patch(
      "src/tests/example.ts",
      "useGlobalHookUser",
      () => () => patchObj
    );
    jest.resetModules();
    useGlobalHookUser = require("./example").useGlobalHookUser;
    expect(useGlobalHookUser()).toEqual({ hook: notPatched("GlobalHook") });

    unpatch();
  });
});
