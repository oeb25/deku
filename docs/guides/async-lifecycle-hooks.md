## Experimental: ES7 async functions

The purpose of most lifecycle hooks is usually to update the state, either by inspecting the DOM or fetching some external resources. We can simplify the concept of the lifecycle hooks by making the pure using ES7 async functions.

```js
async function afterMount ({ props }, el) {
  var items = await request(props.url)
  var projects = await Projects.getAll()

  // Return an object to update state
  return {
    items: items,
    projects: projects,
    loaded: true
  }
}
```

Instead of using the `updateState` function we can just return an object that will be merged in with the current state. We can do this because the lifecycle hooks are able to return a promise that resolves into a state change. All you need to do is return a promise and resolve it with an object.

We could do this with standard promises too:

```js
function afterMount ({ props }, el) {
  return request(props.url)
    .then(Projects.getAll)
    .then(function(items, projects){
      return {
        items: items,
        projects: projects,
        loaded: true
      }
    })
}
```
