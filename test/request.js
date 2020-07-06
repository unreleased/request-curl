const assert = require('assert')
const request = require('../index')

/**
 * request-curl unit tests
 * run: `npm test`
 */



it('should get a 200 response after following a redirect', function () {
  const opts = {
    uri: 'http://httpbin.org/absolute-redirect/3',
    followRedirects: true
  }

  return request(opts).then(res => {
    // 200 After it follows the three redirects.
    assert.equal(res.statusCode, 200)
  })
}).timeout(7500)

it('should get a 302 response and not follow the redirect', function () {
  const opts = {
    uri: 'http://httpbin.org/absolute-redirect/1',
    followRedirects: false
  }

  return request(opts).then(res => {
    // 302 if it hasn't followed the redirect :)
    assert.equal(res.statusCode, 302)
  })
}).timeout(5000)

it('should set cookies to the jar which should be present on the request afterwards', function () {
  const jar = request.jar()

  const opts = {
    uri: 'http://httpbin.org/cookies/set/foo/bar',
    jar: jar
  }

  return request(opts).then(res => {
    const cookies = jar.getCookieStringSync('http://httpbin.org/')
    assert.equal(cookies, 'foo=bar')
  })
}).timeout(5000)

it('should return 200 when the request finished', function () {
  return request('http://httpbin.org/status/200').then(res => {
    assert.equal(res.statusCode, 200)
  })
}).timeout(5000)

it('should return a parsed object when the request is finished', function () {
  const opts = {
    uri: 'http://httpbin.org/headers',
    json: true
  }

  return request(opts).then(res => {
    assert.equal(typeof res.body, 'object')
  })
}).timeout(5000)

it('should show request-curl-test/1.1 as the user-agent', function () {
  const opts = {
    uri: 'http://httpbin.org/headers',
    headers: {
      'user-agent': 'request-curl-test/1.1'
    },
    json: true
  }

  return request(opts).then(res => {
    assert.equal(res.body.headers['User-Agent'], 'request-curl-test/1.1')
  })
}).timeout(5000)

it('should fail to decode gzip formatted data', function () {
  const opts = {
    uri: 'https://httpbin.org/gzip',
    headers: {
      'accept-encoding': 'gzip'
    },
    gzip: false
  }

  return request(opts).then(res => {
    if (res.headers['Content-Encoding'] === 'gzip') {
      // Find a keyword that would exist in body
      assert.equal(res.body.includes('headers'), false)
    }
  })
}).timeout(5000)

it('should decode gzip formatted data', function () {
  const opts = {
    uri: 'https://httpbin.org/gzip',
    headers: {
      'accept-encoding': 'gzip'
    },
    gzip: true
  }

  return request(opts).then(res => {
    if (res.headers['Content-Encoding'] === 'gzip') {
      // Find a keyword that would exist in body
      assert.equal(res.body.includes('headers'), true)
    }
  })
}).timeout(5000)

it('should contain headers set by two different default functions', function () {
  const defaults = request.defaults({
    headers: {
      'foo': 'bar'
    }
  }).defaults({
    headers: {
      'moo': 'car'
    },
    json: true
  })
  
  defaults('http://httpbin.org/headers').then(res => {
    const hasHeaders = (res.body.headers['Foo'] && res.body.headers['Moo']) ? true : false
    assert.equal(hasHeaders, true)
  })

}).timeout(5000)

it('should contain different header values set by two different default functions', async function () {
  const defaults1 = request.defaults({
    headers: {
      'foo': 'bar'
    },
    json: true
  })
  
  const defaults2 = defaults1.defaults({
    headers: {
      'foo': 'car'
    },
    json: true
  })

  // Run backwards
  const response2 = await defaults2('http://httpbin.org/headers').then(res => res.body.headers['Foo'])
  const response1 = await defaults1('http://httpbin.org/headers').then(res => res.body.headers['Foo'])

  assert.notEqual(response2, response1)
}).timeout(5000)

it('should return the form data', function () {
  const payload = {
    'foo': 'bar',
    'moo': 'carrr'
  }

  // Will automatically append application/x-www-form-urlencoded header if one isn't set through headers
  // It will not modify the request if a different content-type is set
  const opts = {
    uri: 'http://httpbin.org/anything',
    form: payload,
    json: true
  }

  return request(opts).then(res => {
    const len = Object.keys(res.body.form).length
    assert.equal(len, 2)
  })
})

it('should return the json data', function () {
  const payload = {
    'foo': 'bar',
    'moo': 'carrr'
  }

  // Will automatically append application/json header if one isn't set through headers
  // It will not modify the request if a different content-type is set
  const opts = {
    uri: 'http://httpbin.org/anything',
    body: payload,
    json: true
  }

  return request(opts).then(res => {
    const len = Object.keys(res.body.json).length
    assert.equal(len, 2)
  })
})
  
it('should return different cookies from different cookie jars', async function () {
  // Create jar and set cookies to it
  const jar1 = request.jar()
  jar1.setCookieSync('foo=bar', 'http://httpbin.org/')
  jar1.setCookieSync('moo=car', 'http://httpbin.org/')

  const jar2 = request.jar()
  jar2.setCookieSync('you=are', 'http://httpbin.org/')
  jar2.setCookieSync('sup=er', 'http://httpbin.org/')

  const opts = {
    uri: 'http://httpbin.org/cookies',
    json: true,
  }

  const cookies1 = await request({ ...opts, jar: jar1 }).then(res => res.body.cookies)
  const cookies2 = await request({ ...opts, jar: jar2 }).then(res => res.body.cookies)

  function deepEqual(x, y) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
      ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
  }

  // Should be false
  assert.equal(deepEqual(cookies1, cookies2), false)
}).timeout(7500)

it('should return the cookies from the cookie jar and header and make the request return the combined cookies', function () {
  // Create jar and set cookies to it
  const jar = request.jar()
  jar.setCookieSync('foo=bar', 'http://httpbin.org/')
  jar.setCookieSync('moo=car', 'http://httpbin.org/')

  const opts = {
    uri: 'http://httpbin.org/cookies',
    headers: {
      'cookie': 'too=far'
    },
    jar: jar,
    json: true
  }

  return request(opts).then(res => {
    // Should have three cookies
    const len = Object.keys(res.body.cookies).length
    assert.equal(len, 3)
  })
}).timeout(5000)

it('should return the cookies from the cookie jar', function () {
  // Create jar and set cookies to it
  const jar = request.jar()
  jar.setCookieSync('foo=bar', 'http://httpbin.org/')
  jar.setCookieSync('moo=car', 'http://httpbin.org/')

  const opts = {
    uri: 'http://httpbin.org/cookies',
    jar: jar,
    json: true
  }

  return request(opts).then(res => {
    // Should have three cookies
    const len = Object.keys(res.body.cookies).length
    assert.equal(len, 2)
  })
}).timeout(5000)