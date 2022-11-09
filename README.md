# jsmock

Jest transform based mocking library inspired by mock from python


Are you tired of needing to setup `TestProviders` and loading heavy dependencies just to test to your components (looking at you `apollo-graphql`)?
Don't you wish you could just mock that hook call directly instead of digging through its implementation to figure out what context it needs to give you the result you want to test?

This this might be the mocking library for you!


Say you have this component:
```
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

Previously you would have to setup `SomeContext` and hook into the implementation of `useDataProvider` so that you can make it return a mock.

Now you can diretly dependency inject `useDataProvider` and `useContext` rather than needing to know anything about how they work.

```
it('renders the correct case', async () => {
  
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
  await act(() => {
    render(<MyComponent />
  });
  
  unpatchDataProvider();
  expect(screen.getByTestId("case1-component")).toBeVisible();
});


```
