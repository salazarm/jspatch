import { __patch } from "../index";

import { useCar, useOtherCar } from "./car";

const NOT_PATCHED = "Not patched!";
// const TEST_TYPES = [
//   { object: { hello: 0 } },
//   (...args: any[]) => console.log(...args),
//   null,
//   false,
//   1,
//   "hello",
//   true,
//   Symbol(),
// ];

describe("Mock", () => {
  const obj = "IT WORKS!";
  // TEST_TYPES.forEach((obj) => {
  it("can patch a value at the global scope", () => {
    console.log("running test");
    const result1 = useCar();
    expect(result1).toBe(NOT_PATCHED);

    const unpatch = __patch("src/tests/car", "useHook", () => () => obj);

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
    console.log("running test2");
    // useHook` is patched for useCar but useOtherCar is unaffected
    const unpatch = __patch("src/tests/car", "useCar.useHook", () => () => obj);

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
  // });
});
