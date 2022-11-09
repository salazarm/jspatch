const notImplemented = (..._args: any[]) => {
  return "Not patched!";
};
const useHook = notImplemented;

console.log("factory: car.ts");
export function useCar() {
  const randomHook = useHook();
  return { randomHook };
}

export function useOtherCar() {
  const randomHook = useHook();
  return { randomHook };
}
