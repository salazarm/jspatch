# jspatch 

JSPatch is a library inspired by [mock.patch](https://docs.python.org/3/library/unittest.mock.html#patch) from python. It leverages Jest code transformations in order to modify files under test so that we can dynamically patch arbitrary identifiers.


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

Now you can directly mock your variables:

```javascript
it('renders the correct case', async () => {
  // Patch the hooks directly
  const unpatchDataProvider = patch('src/components/MyComponent', 'MyComponent.someContextState', () => CASE_1_STATE);
  const unpatchSomeContext = patch('src/components/MyComponent', 'MyComponent.state', () =>SOME_CONTEXT_STATE_FIXTURE);
  
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

If you prefer you could also dependency inject `useDataProvider` and `useContext` (if you want to make assertions about arguments passed in):
```javascript
it('renders the correct case', async () => {
  // Patch the hooks directly
  const unpatchDataProvider = patch('src/components/MyComponent', 'MyComponent.useDataProvider', () => {
    return (key) => {
      return CASE_1_STATE;
    }
  });
  const unpatchSomeContext = patch('src/components/MyComponent', 'MyComponent.useContext', () => {
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
