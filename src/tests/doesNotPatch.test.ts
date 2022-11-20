import api from "../api";
debugger;
import { useGlobalHookUser, useGlobalHookUser2 } from "./example";

const { __patch } = api;

const notPatched = (name: string) => `${name} not patched!`;
const patchObj = "doesNotPatch.test.ts";

describe("Patch from separate test files should both be applied", () => {
  it("can patch a variable directly", () => {
    const result1 = useGlobalHookUser();
    expect(result1).toEqual({
      hook: notPatched("GlobalHook"),
    });

    const unpatch = __patch("src/tests/example", "hook", () => patchObj);

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

    unpatch();
  });
});

describe("does not patch", () => {
  it("does not patch import specifier", () => {});
  it("does not patch import or export specifier", () => {});
  it("does not patch export declaration", () => {});
  it("does not patch property access expression", () => {});
  it("does not patch function declaration", () => {});
  it("does not patch binding element", () => {});
});
