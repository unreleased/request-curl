

/**
 * Slight adaptation for request-curl
 * Based on request.js 
 */


const extend = require('extend')
const tough = require("tough-cookie")


function initParams(uri, options) {
  const params = {}

  if (options !== null && typeof options === 'object') {
    extend(params, options, { uri: uri })
  } else if (typeof uri === 'string') {
    extend(params, { uri: uri })
  } else {
    extend(params, uri)
  }

  return params
}


function Request(uri, options) {
  if (typeof uri === 'undefined') {
    throw new Error('undefined is not a valid uri or options object.')
  }

  const params = initParams(uri, options)

  return new Request.Request(params)
}

Request.get = verbFunc('get')
Request.head = verbFunc('head')
Request.options = verbFunc('options')
Request.post = verbFunc('post')
Request.put = verbFunc('put')
Request.patch = verbFunc('patch')
Request.del = verbFunc('delete')
Request.delete = verbFunc('delete')

Request.jar = function () {
  return new tough.CookieJar()
}

function verbFunc(verb) {
  const method = verb.toUpperCase()
  return function (uri, options) {
    const params = initParams(uri, options)
    params.method = method

    return Request(params)
  }
}

function wrapRequestMethod(method, options, requester, verb) {
  return function (uri, opts) {
    const params = initParams(uri, opts)
    const target = {}

    extend(true, target, options, params)

    if (verb) {
      target.method = verb.toUpperCase()
    }

    if (typeof request === 'function') {
      method = requester
    }

    return method(target)
  }
}

Request.defaults = function (options, requester) {
  const self = this

  options = options || {}

  if (typeof options === 'function') {
    requester = options
    options = {}
  }

  const defaults = wrapRequestMethod(self, options, requester)

  const verbs = ['get', 'head', 'post', 'put', 'patch', 'del', 'delete']
  verbs.forEach(function (verb) {
    defaults[verb] = wrapRequestMethod(self[verb], options, requester, verb)
  })

  defaults.defaults = self.defaults
  defaults.jar = self.jar

  return defaults
}


module.exports = Request
Request.Request = require('./request')