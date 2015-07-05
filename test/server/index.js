/** @jsx element */

import assert from 'assert'
import element from 'virtual-element'
import {renderString} from '../../'

it('should render an element', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <div></div>
    }
  };
  assert.equal(renderString(<Component />), '<div></div>')
});

it('should render an element with attributes', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <div id="foo" />
    }
  };
  assert.equal(renderString(<Component />), '<div id="foo"></div>')
});

it('should render an element with text', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <div>foo</div>
    }
  }
  assert.equal(renderString(<Component />), '<div>foo</div>')
});

it('should render an element with child elements', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <div><span>foo</span></div>;
    }
  };
  assert.equal(renderString(<Component />), '<div><span>foo</span></div>')
});

it('should render an element with child components', function(){
  var Span = {
    render: function(component){
      let {props, state} = component
      return <span>foo</span>;
    }
  };
  var Div = {
    render: function(component){
      let {props, state} = component
      return <div><Span /></div>;
    }
  };
  assert.equal(renderString(<Div />), '<div><span>foo</span></div>')
});

it('should render an element with component root', function(){
  var Span = {
    render: function(component){
      let {props, state} = component
      return <span>foo</span>
    }
  };
  var Component = {
    render: function(component){
      let {props, state} = component
      return <Span />;
    }
  };
  assert.equal(renderString(<Component />), '<span>foo</span>')
});

it('should render with props', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <div>{props.text}</div>;
    }
  };
  assert.equal(renderString(<Component text="foo" />), '<div>foo</div>')
});

it('should render with initial state', function(){
  var Component = {
    initialState: function(props){
      return { text: 'foo', count: props.initialCount }
    },
    render: function(component){
      let {props, state} = component
      return <div count={state.count}>{state.text}</div>
    }
  };
  assert.equal(renderString(<Component initialCount={0} />), '<div count="0">foo</div>')
});

it('should have initial props', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <div>{props.text}</div>
    },
    defaultProps: {
      text: 'Hello!'
    }
  }
  assert.equal(renderString(), '<div>Hello!</div>')
})

it('should call beforeMount and beforeRender', function(done){
  var Component = {
    initialState: function(){
      return { text: 'foo' }
    },
    beforeMount: function(component){
      let {props, state} = component
      assert(props.foo)
      assert(state.text)
    },
    beforeRender: function(component){
      let {props, state} = component
      assert(props.foo)
      assert(state.text)
      done()
    },
    render: function(props, state){
      return dom('div');
    }
  };
  renderString(<Component foo="bar" />)
})

it('should render innerHTML', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return dom('div', { innerHTML: '<span>foo</span>' });
    }
  };
  assert.equal(renderString(<Component />), '<div><span>foo</span></div>')
})

it('should render the value of inputs', function(){
  var Component = {
    render: function(component){
      let {props, state} = component
      return <input value="foo" />
    }
  };
  assert.equal(renderString(<Component />), '<input value="foo"></input>')
})

it('should not render event handlers as attributes', function () {
  var Component = {
    render: function() {
      return <div onClick={foo} />
    }
  }
  function foo() {}
  assert.equal(renderString(<Component />), '<div></div>')
});
