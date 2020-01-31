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
- [ ] Automatic Cookiejar/Cookie sessions
- [ ] Automatic toJSON
