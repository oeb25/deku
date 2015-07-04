# Components

Components are re-usable pieces of your UI. You can think of components as custom elements you can use and compose, just like the native `<select>` element.

For each lifecycle hook you can add a function to your component to either manipulate state or to return something needed by the component.

Components are just objects with functions and properties on them. They don't store any state on themselves or use `this` anywhere.

```js
export let Button = {
  render (component) {
    let {props,state} = component
    return <div>{props.children}</div>
  }
}
```

To use this in our app, we would just import it and mount it:

```js
import {Button} from './button.js'
import {element,tree,render} from 'deku'

let app = tree(
  <Button>Hello!</Button>
)

render(app, document.body)
```

First, we're just importing the button object. Then we create an app using the `deku` function. Then we mount our element onto the app. Then we use the `render` function to render it into the DOM.

## Components

Each element of your UI can be broken into encapsulated components. These components manage the state for the UI element and tell it how to render. In Deku components are just plain objects:

```js
function render (component) {
  let {props, state} = component
  return <button class="Button">{props.children}</button>
}

export default {render}
```

There is no concept of classes or use of `this`. We can import this component using the standard module syntax:

```js
import Button from './button'
```

[Read more about components](https://github.com/dekujs/deku/blob/master/docs/guides/components.md)

## Event handlers

Deku doesn't use any form of synthetic events because we can just capture every event in newer browsers. There are special attributes you can add to virtual elements that act as hooks to add event listeners:

```js
function render (component) {
  let {props, state} = component
  return <button onClick={clicked}>{props.children}</button>
}

function clicked (event, component, updateState) {
  alert('You clicked it')
}
```

You can [view all event handlers](https://github.com/dekujs/deku/blob/master/lib/events.js) in code.

You can access the event, the component and update the state in event handlers:

```js
function clicked (event, component, updateState) {
  let {props,state} = component
}
```

To access the element you'll usually want to `event.target`. This is the element the event was triggered on. We also set `event.delegateTarget` that will always be set to the element that owns the handler if it was a deeper element that triggered the event.

## Lifecycle hooks

Just like the `render` function, component lifecycle hooks are just plain functions:

```js
function afterUpdate (component, prevProps, prevState, updateState) {
  let {props, state} = component
  if (!state.clicked) {
    updateState({ clicked: true })
  }
}
```

We have hooks for `beforeMount`, `afterMount`, `beforeUpdate`, `afterUpdate`, `beforeUnmount` and two new hooks - `beforeRender` and `afterRender` that are called on every pass, unlike the update hooks. We've found that these extra hooks have allowed us to write cleaner code and worry less about the state of the component.

[Learn more about the lifecycle hooks](https://github.com/dekujs/deku/blob/master/docs/guides/components.md)

## innerHTML

You can set a string of html to be set as `innerHTML` using the `innerHTML` attribute on your virtual elements:

```
<div innerHTML="<span>hi</span>" />
```

**Deku doesn't do any sanitizing of the HTML string so you'll want to do that yourself to prevent XSS attacks.**

## Component Interface

Here is a full list of all of the available component properties:

```js
// Define a name for the component that can be used in debugging
export let name = 'My Component'

// Get the initial state for the component. We don't pass props in here like
// React does because the state should just be computed in the render function.
export function initialState (props) {
  return {
    open: true
  }
}

// Default props can be defined that will be used across all instances.
export let defaultProps = {
  style: 'round'
}

// This is called on both the server and the client.
//
// Client: Yes
// Server: Yes
export function beforeMount (component) {
  let {props, state, id} = component
}

// This is called on each update and can be used to skip renders to improve
// performance of the component.
//
// Client: Yes
// Server: No
export function shouldUpdate (component, nextProps, nextState) {
  let {props, state, id} = component
  return true
}

// Called before each render on both the client and server.
//
// Example use cases:
// - Updating stream/emitter based on next props
//
// Client: Yes
// Server: Yes
export function beforeRender (component) {
  let {props, state, id} = component
}

// This isn't called on the first render only on updates.
//
// Example use cases:
// - Updating stream/emitter based on next props
//
// Client: Yes
// Server: No
export function beforeUpdate (component, nextProps, nextState) {
  let {props, state, id} = component
}

// Render a component. We need to pass in setState so that callbacks on
// sub-components. This may change in the future.
//
// Client: Yes
// Server: Yes
export function render (component, setState) {
  let {props, state, id} = component
  return <div></div>
}

// Called after every render, including the first one. This is better
// than the afterUpdate as it's called on the first render so if forces
// us to think in single renders instead of worrying about the lifecycle.
// It can't update state here because then you'd be changing state based on
// the DOM.
//
// Example use cases:
// - Update the DOM based on the latest state eg. animations, event handlers
//
// Client: Yes
// Server: No
export function afterRender (component, el) {
  let {props, state, id} = component
}

// Not called on the first render but on any update.
//
// Example use cases:
// - Changing the state based on the previous state transition
// - Calling callbacks when a state change happens
//
// Client: Yes
// Server: No
export function afterUpdate (component, prevProps, prevState, setState) {
  let {props, state, id} = component
}

// This is called after the component is rendered the first time and is only
// ever called once.
//
// Use cases:
// - Analytics tracking
// - Loading initial data
// - Setting the state that should change immediately eg. open/close
// - Adding DOM event listeners on the window/document
// - Moving the element in the DOM. eg. to the root for dialogs
// - Focusing the element
//
// Client: Yes
// Server: No
export function afterMount (component, el, setState) {
  let {props, state, id} = component
}

// This is called once just before the element is removed. It should be used
// to clean up after the component.
//
// Use cases:
// - Unbind window/document event handlers
// - Edit the DOM in anyway to clean up after the component
// - Unbind any event emitters
// - Disconnect streams
//
// Client: Yes
// Server: No
export function beforeUnmount (component, el) {
  let {props, state, id} = component
}
```
