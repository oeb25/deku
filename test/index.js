require('es6-promise').polyfill()
require("babelify/polyfill")

describe('Client Rendering', function(){

  beforeEach(function(){
    this.el = document.createElement('div')
    document.body.appendChild(this.el)
  })

  afterEach(function(){
    document.body.removeChild(this.el)
  })

  require('./client')
  // require('./client/mount-hook')
  // require('./client/update-hook')
  // require('./client/props')
  // require('./client/elements')
  // require('./client/text')
  // require('./client/attributes')
  // require('./client/replace')
  // require('./client/events')
  // require('./client/state')
  // require('./client/pool')
  // require('./client/data')
  // require('./client/validate')
  // require('./client/keys')
  // require('./client/hooks')
  // require('./client/svg')
  // require('./client/sources')
  // require('./client/register')
})

describe('Server Renderer', function(){
  // require('./server')
})
