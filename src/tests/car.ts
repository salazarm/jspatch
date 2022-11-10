const notImplemented = (..._args: any[]) => {
  return "Not patched!";
};
const useHook = notImplemented;

export function useCar() {
  const randomHook = useHook();
  return { randomHook };
}

export function useOtherCar() {
  const randomHook = useHook();
  return { randomHook };
}
