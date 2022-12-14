# ![jpatchpsd](https://user-images.githubusercontent.com/2286579/203386347-9b5e1f05-79d0-41a9-83b9-acb1bbac6992.png)

JSPatch is a library inspired by [mock.patch](https://docs.python.org/3/library/unittest.mock.html#patch) from python. It leverages Jest code transformations in order to modify files under test so that we can dynamically patch arbitrary identifiers.

![image](https://user-images.githubusercontent.com/2286579/205362096-3daf7f7b-bb3c-4ddf-b7bd-bdf74e0f9069.png)


Say you have this component:
```javascript
export function MyComponent() {
  const someContextState = useContext(SomeContext);
  const state = useDataProvider(someKey);

  switch (state.type) {
    case "loading":
      return <Loading />;
    case "case1":
      return <Case1 />;
    case "case2":
      return <Case2 />;
    default:
      return <Default state={someContextState} />;
  }
}
```

Before this library you would have to setup `SomeContext` and hook into the implementation of `useDataProvider` so that you can make it return data corresponding to the state you're trying to test.


Now instead you can dependency inject `useDataProvider` and `useContext` directly regardless of whether its part of a public module API.

```javascript
it('renders the correct case', async () => {
  // Patch the hooks directly
  const unpatchDataProvider = __patch('src/components/MyComponent', 'MyComponent.useDataProvider', () => {
    return (key) => {
      return CASE_1_STATE;
    }
  });
  const unpatchSomeContext = __patch('src/components/MyComponent', 'MyComponent.useContext', () => {
    return (context) => {
      if (context === SomeContext) {
        return SOME_CONTEXT_STATE_FIXTURE;
      }
    }
  });
  
  // Render the component
  await act(() => {
    render(<MyComponent />
  });
  
  // Remember to unpatch for the next test!
  unpatchDataProvider();
  unpatchSomeContext();
  expect(screen.getByTestId("case1-component")).toBeVisible();
});
```



# Installation

`npm install jspatch`

in `jest.config.js` add:
```javascript
module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": "jspatch",
  },
};
```


In your test file:

```javascript
import jspatch from "jspatch";
const { __patch } = jspatch;


__patch("path/to/file", "component.useUserEmailHook", () => "test@email.com"
```

Note: For now, if you're using this library and are patching in multiple test files then you will need to either (1). Make your patches happen in a single file that is executed as part of jest global setup. or (2) use `--no-cache`. This is only temporary until https://github.com/facebook/jest/pull/13620 lands
