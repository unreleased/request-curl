# curl-request

The goal of this library is to use the request.js syntax/options without using NodeJS's default HTTP Client and instead using cURL to make the requests. Made after spending too long looking for a good HTTP2 supported request client without running into major issues when using proxies or making mass requests such as `h2-request` or `got`. Built to help emulate similar browser-similar HTTP(S) requests to browsers without using a CPU/Memory intensive program such as Selenium or Puppeteer.

## Supported Features

- [x] Headers
- [x] HTTP1/HTTP2
- [x] Cipher suites
- [x] Proxy support
- [x] gzip, deflare & br decompression
- [x] Following redirects
- [x] Max redirects
- [x] SSL support
- [x] Proxy tunnelling
- [x] Automatically convert body to JSON
- [ ] Automatic Cookiejar/Cookie sessions


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

## Cipher suites

You can specify custom cipher suites as an array or space-separated string.

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers',
    ciphers: [ // No default ciphers set.
        'AES128-SHA256',
        'AES256-SHA256',
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384'
    ]
}
```

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
    json: true // default false
```