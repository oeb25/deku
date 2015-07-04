## Keys

Sometimes when you're rendering a list of items you want them to be moved instead of trashed during the diff. Deku supports this using the `key` attribute on components:

```js
function render (component) {
  let {items} = component.props
  let projects = items.map(function (project) {
    return <ProjectItem key={project.id} project={project} />
  })
  return <div class="ProjectsList">{projects}</div>
}
```

At the moment we only support the `key` attribute on components for simplicity. Things become slightly more hairy when moving elements around within components. So far we haven't ran into a case where this has been a major problem.
