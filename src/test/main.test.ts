import { patch } from "../../build/main";
import { useCar, useOtherCar } from "./car";

const NOT_PATCHED = "Not patched!";

describe("Mock", () => {
  TEST_TYPES.forEach((obj) => {
    it("can patch a value at the global scope", () => {
      const result1 = useCar();
      expect(result1).toBe(NOT_PATCHED);

      const unpatch = patch("src.test.car.useHook", () => () => obj);

      const result2 = useCar();
      expect(result2).toBe({
        randomHook: obj,
      });

      unpatch();

      const result3 = useCar();
      expect(result3).toBe({
        randomHook: NOT_PATCHED,
      });
    });

    it("can patch a value at the local scope", () => {
      // useHook` is patched for useCar but useOtherCar is unaffected
      const unpatch = patch("src.test.car.useCar.useHook", () => () => obj);

      const car = useCar();
      const otherCar = useOtherCar();
      expect(car).toBe({
        randomHook: obj,
      });

      expect(otherCar).toBe({
        randomHook: NOT_PATCHED,
      });

      unpatch();
    });
  });
});

const TEST_TYPES = [
  { object: { hello: 0 } },
  (...args) => console.log(...args),
  null,
  false,
  1,
  "hello",
  true,
  Symbol(),
];
