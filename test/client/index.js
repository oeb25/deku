/** @jsx element */

import trigger from 'trigger-event'
import Emitter from 'component-emitter'
import raf from 'component-raf'
import assert from 'assert'
import element from 'virtual-element'
import {render,remove} from '../../'
import {HelloWorld,Span,TwoWords} from '../lib/helpers'
import memoize from 'memoizee'

it('should render and remove an element', function(){
  var el = this.el
  render(el, <span>Hello World</span>)
  assert.equal(el.innerHTML, '<span>Hello World</span>')
  remove(el)
  assert.equal(el.innerHTML, '')
})

it('should replace a mounted element', function(){
  var el = this.el
  render(el, <span>Hello World</span>)
  render(el, <div>Foo!</div>)
  assert.equal(el.innerHTML, '<div>Foo!</div>')
  remove(el)
  assert.equal(el.innerHTML, '')
})

it('should remove the mounted element when unmounted', function(){
  var el = this.el
  render(el, <span>Hello World</span>)
  assert.equal(el.innerHTML, '<span>Hello World</span>')
  remove(el)
  assert.equal(el.innerHTML, '')
  render(el, <div>Hello World</div>)
  assert.equal(el.innerHTML, '<div>Hello World</div>')
  remove(el)
  assert.equal(el.innerHTML, '')
})

it('should render and remove a component', function(){
  var Test = {
    render: function () {
      return <span>Hello World</span>
    }
  }
  var el = this.el
  render(el, <Test />)
  assert.equal(el.innerHTML, '<span>Hello World</span>')
  remove(el)
  assert.equal(el.innerHTML, '')
})

it('should have initial state', function(){
  var DefaultState = {
    initialState: function (props) {
      return {
        text: 'Hello World',
        count: props.initialCount
      }
    },
    render: function({ props, state }){
      return <span count={state.count}>{state.text}</span>
    }
  }
  render(this.el, <DefaultState initialCount={2} />)
  assert.equal(this.el.innerHTML, '<span count="2">Hello World</span>')
  remove(this.el)
})

it('should create a component with properties', function(){
  var Test = {
    render (component) {
      let {props, state} = component
      return <span>{props.text}</span>
    }
  }
  render(this.el, <Test text="Hello World" />)
  assert.equal(this.el.innerHTML, '<span>Hello World</span>')
  remove(this.el)
})

it.only('should compose components', function(){
  var Composed = {
    render: function(){
      return <HelloWorld />
    }
  }
  this.render(<Composed />)
  assert.equal(this.el.innerHTML, '<span>Hello World</span>')
});

it('should render a component using jsx', function(){
  var Test = {
    render: function(){
      return <span class="yup">Hello World</span>
    }
  }
  render(this.el, <Test />)
  assert.equal(this.el.innerHTML, '<span class="yup">Hello World</span>')
  remove(this.el)
})

it('should compose components and pass in props', function () {
  var Composed = {
    render: function (component) {
      return <TwoWords one='Hello' two='World' />
    }
  }
  render(this.el, <Composed />)
  assert.equal(el.innerHTML, '<span>Hello World</span>')
  remove(this.el)
});

it('should update sub-components', function(){
  var Composed = {
    render: function(component){
      let {props, state} = component
      return (
        <div>
          <TwoWords one="Hello" two={props.app} />
        </div>
      );
    }
  };
  render(this.el, <Composed app="Pluto" />)
  assert.equal(el.innerHTML, '<div><span>Hello Pluto</span></div>')
  remove(this.el)
})

it('should update on the next frame', function(done){
  var Composed = {
    initialState: function () {
      return { greeting: 'Hello' }
    },
    afterMount: function (component, el, setState) {
      setState({ greeting: 'Greetings' })
    },
    render: function({ props, state }){
      return (
        <div>
          <TwoWords one={state.greeting} two={props.planet} />
        </div>
      )
    }
  }
  render(this.el, <Composed planet="Pluto" />)
  assert.equal(el.innerHTML, '<div><span>Hello Pluto</span></div>')
  raf(function(){
    assert.equal(el.innerHTML, '<div><span>Greetings Pluto</span></div>')
    remove(this.el)
    done()
  })
})

it('should allow components to have child nodes', function(){
  var ComponentA = {
    render: function ({ props, state }) {
      return <div>{props.children}</div>
    }
  }
  var ComponentB = {
    render: function ({ props, state }) {
      return (
        <ComponentA>
          <span>Hello World!</span>
        </ComponentA>
      )
    }
  }
  render(this.el, ComponentB)
  assert.equal(el.innerHTML, '<div><span>Hello World!</span></div>')
})

it('should update component child nodes', function(){
  var ComponentA = {
    render: function ({ props, state }) {
      return <div>{props.children}</div>
    }
  };
  var ComponentB = {
    render: function ({ props, state }) {
      return (
        <ComponentA>
          <span>{props.text}</span>
        </ComponentA>
      )
    }
  }
  render(this.el, <ComponentB text='Hello world!' />)
  render(this.el, <ComponentB text='Hello Pluto!' />)
  assert.equal(el.innerHTML, '<div><span>Hello Pluto!</span></div>')
})

it('should allow components to have other components as child nodes', function(){
  var ComponentA = {
    render: function ({ props, state }) {
      return <div name='ComponentA'>{props.children}</div>
    }
  }
  var ComponentC = {
    render: function ({ props, state }) {
      return <div name='ComponentC'>{props.children}</div>
    }
  }
  var ComponentB = {
    render: function ({ props, state }) {
      return (
        <div name='ComponentB'>
          <ComponentA>
            <ComponentC text={props.text}>
              <span>Hello Pluto!</span>
            </ComponentC>
          </ComponentA>
        </div>
      )
    }
  }
  render(this.el, <ComponentB text='Hello World!' />)
  assert.equal(el.innerHTML, '<div name="ComponentB"><div name="ComponentA"><div name="ComponentC"><span>Hello Pluto!</span></div></div></div>')
  remove(this.el)
})

it('should only update ONCE when props/state is changed in different parts of the tree', function () {
  var i = 0;
  var emitter = new Emitter();
  var ComponentA = {
    initialState: function(){
      return {
        text: 'Deku Shield'
      }
    },
    afterMount: function ({ props, state }, el, updateState) {
      emitter.on('data', function(text){
        updateState({ text: text });
      })
    },
    render: function ({ props, state }) {
      i++;
      return <div>{props.text} {state.text}</div>
    }
  }
  var ComponentB = {
    render: function ({ props, state }) {
      i++;
      return <div><ComponentA text={props.text} /></div>
    }
  }
  render(this.el, <ComponentB text='2x' />)
  emitter.emit('data', 'Mirror Shield');
  render(this.el, <ComponentB text='3x' />)
  assert.equal(i, 2)
  assert.equal(el.innerHTML, "<div><div>3x Mirror Shield</div></div>")
  remove(this.el)
})

it('should only update if shouldUpdate returns true', function(){
  var i = 0;
  var Component = {
    afterUpdate () {
      i = i + 1
    },
    shouldUpdate () {
      return false
    },
    render(){
      return <div />
    }
  }
  render(this.el, <Component foo="bar" />)
  assert.equal(i, 0)
  render(this.el, <Component foo="baz" />)
  assert.equal(i, 0)
})

it('should skip rendering if the same virtual element is returned', function () {
  var i = 0
  var el = <div>Hello World</div>
  var Component = {
    render(component){
      i += 1
      return el
    },
    afterUpdate() {
      throw new Error('Should not update')
    }
  }
  render(this.el, <Component count={0} />)
  render(this.el, <Component count={1} />)
  assert.equal(i, 2)
})

// Test is failing in IE10 because of memoizee
it.skip('should allow memoization of the render function', function (done) {
  var i = 0
  var Component = {
    initialState: function() {
      return { open: false }
    },
    render: memoize(function (component) {
      let {props,state} = component
      i += 1
      return <div>Hello World</div>
    }),
    afterUpdate() {
      throw new Error('Should not update')
    }
  };
  var app = deku(<Component count={0} />)
  mount(app, function(){
    app.mount(<Component count={0} />)
    assert.equal(i, 1)
    done()
  })
});

it('should empty the container before initial render', function () {
  var Component = {
    render: function () {
      return <div>b</div>
    }
  }
  this.el.innerHTML = '<div>a</div>';
  render(this.el, <Component />)
  assert.equal(el.innerHTML, '<div>b</div>');
  remove(this.el)
})
