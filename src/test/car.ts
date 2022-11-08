const notImplemented = (..._args) => {
  return "Not patched!";
};
const useHook = notImplemented;

const value1 = "Not patched";
const value2 = "Not patched";

export function useCar() {
  const randomHook = useHook();
  return { randomHook, value1, value2 };
}

export function useOtherCar() {
  const randomHook = useHook();
  return { randomHook, value1, value2 };
}
