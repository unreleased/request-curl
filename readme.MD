# request-curl

The goal of this library is to use the request.js syntax/options without using NodeJS's default HTTP Client and instead using cURL to make the requests. Made after spending too long looking for a good HTTP2 supported request client without running into major issues when using proxies or making mass requests such as [`h2-request`](https://www.npmjs.com/package/h2-request) or [`got`](https://www.npmjs.com/package/got). Built to help emulate similar browser-similar HTTP(S) requests to browsers without using a CPU/Memory intensive program such as Selenium or Puppeteer.

## Supported Features

- [x] Headers
- [x] HTTP1.1/HTTP2
- [x] Cipher suites
- [x] Proxy support
- [x] gzip, deflare & br decompression
- [x] Following redirects
- [x] Max redirects
- [x] SSL support
- [x] Automatically convert body to JSON
- [x] Built in JSON parsing
- [x] Automatic Cookiejar/Cookie sessions through ['tough-cookie'](https://www.npmjs.com/package/tough-cookie)
- [x] Supports path as is and disabling rebuilding path dot sequences (AKA Path traversing) `/../`
- [x] Support sending JSON body in request
- [x] Ability to disable tcp socket reuse
- [ ] Ability to use `transform` functions

# Getting Started
```javascript
const rc = require("request-curl");
```
`request-curl` works very similar to `request-promise`. The package wraps `node-libcurl` into native promises and uses syntax based on `request`.

## Crawl a webpage
```javascript
(async () => {
  const opts = {
    uri: "https://www.google.com",
    headers: {
      "User-Agent": "request-curl",
    },
  };
  const resp = await rc(opts);
  console.log(resp.body);
});
```
By default, the option `resolveWithFullResponse` is set to true, unlike in `request`. If you want to resolve with only the body, set `resolveWithFullResponse` to `false`.

## GET something from a JSON REST API
```javascript
(async() => {
  const opts = {
    uri: "http://httpbin.org/get",
    json: true, // Automatically parses JSON string in response
    headers: {
      "User-Agent": "request-curl",
    };
  };
  const resp = await rc(opts);
  console.log(resp.body);
});
```

## POST data to JSON REST API
```javascript
(async () => {
  const opts = {
    uri: "http://httpbin.org/post",
    json: true,
    body: {
      "hello": "world",
    },
  };
  const resp = await rc(opts);
  console.log(resp.body);
});
```

## POST like HTML forms
```javascript
(async() => {
  const options = {
    uri: "http://httpbin.org/post",
    form: {
      "hello": "world",
    },
  };
  const resp = await rc(opts);
  console.log(resp.body);
});
```

## Use query strings
```javascript
(async() => {
  const options = {
    uri: "http://httpbin.org/get",
    qs: {
      "hello": "world",
    },
  };
  const resp = await rc(opts);
  console.log(resp.body);
});
```

## Headers

Currently header order is not supported by cURL. This isn't really a big issue currently since there's many browsers that don't have specified header orders which you can emulate. Headers follow the same request.js syntax. By default no headers are set.

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers'
    headers: { // No default headers
        'User-agent': 'CurlyRequest/v1',
        'Accept': 'application/json'
    }
}
```

## HTTP2

Curl-request has built in HTTP2 support. This is not enabled by default and must be enabled with the `http2: true` option.

## Proxy Support

Curl-request has one-line proxy support, The same as request.js, it also has authentication support (User/password proxies)

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers',
    proxy: 'http://username:password@45.212.29.55:3128' // Default false
}
```

## Content Decoding

Curl-request has support for `br`, `gzip` and `deflate` compression, This means You can use the same `Accept-Encoding` headers as Google Chrome whilst being able to decode the response. Also helps save file-transfer size.

You can decode these types of responses using `decode: true` or `gzip: true` (The gzip parameter is for fallback support for request.js). Some websites can return invalid content-encoding types which cURL cannot handle throwing a fatal error. You can get the raw response by setting `decode: false`

## Redirects

You can specify whether to follow redirects using the `followRedirects` key. By default Curl-request will follow 3XX redirects. You can also specify a maximum amount of redirects to follow before exiting the request (Prevent getting stuck in a redirect loop)

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers',
    followRedirects: false, // Default true
    maxRedirects: 5 // Default 10
}
```


## SSL

Force strict usage of SSL in the requests.

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers',
    strictSSL: false, // Default true
}
```

## JSON

Automatically convert the response body to a JSON object rather than having to use `JSON.parse()`.

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers',
    json: true // Default false
}
```