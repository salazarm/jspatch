const notImplemented = (name: string) => (..._args: any[]) => {
  return `${name} not patched!`;
};
const useGlobalHook = notImplemented('GlobalHook');

export const useExportedHook = notImplemented('ExportedHook');

export function useGlobalHookUser() {
  const hook = useGlobalHook();
  return { hook };
}

export function useGlobalHookUser2() {
  const hook = useGlobalHook();
  return { hook };
}

export function useExportedHookUser() {
  const hook = useExportedHook();
  return { hook };
}

export class TestClass {
  readonly testProp = notImplemented('readOnlyTestProp');
  
  getHook() {
    const hook = notImplemented('TestClass:getHook');
    return hook;
  } 

  getHookNoConst() {
    return notImplemented('TestClass:getHookNoConst')
  } 
  getHookArgInClosure() {
    return ((fn) => {
      return fn;
    })(notImplemented('TestClass:getHookArgInClosure'))
  }
}

