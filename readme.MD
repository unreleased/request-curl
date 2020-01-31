# curl-request

The goal of this library is to use the request.js syntax/options without using NodeJS's default HTTP Client and instead using cURL to make the requests. Made after spending too long looking for a good HTTP2 supported request client without running into major issues when using proxies or making mass requests such as `h2-request` or `got`

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

Currently header order is not supported by cURL. This isn't really a big issue currently since there's many browsers that don't have specified header orders which you can emulate. Headers follow the same request.js syntax.

```javascript
const opts = {
    url: 'https://www.httpbin.org/headers'
    headers: {
        'User-agent': 'CurlyRequest/v1',
        'Accept': 'application/json'
    }
}
```