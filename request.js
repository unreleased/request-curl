const { Curl } = require("node-libcurl")
const tough = require("tough-cookie")
const Caseless = require('caseless')
const url = require('url')


class Request {
  constructor(options) {
    return this.init(options)
  }

  async init(options) {
    // Support uri/url params
    if (options.url) {
      options.uri = options.url
    }

    // await new Promise(resolve => setTimeout(resolve, '1000'))
    return new Promise(async (resolve, reject) => {
      const curl = new Curl()

      curl.setOpt('URL', options.uri)

      // Verbose option for debugging
      if (options.verbose) {
        curl.setOpt(Curl.option.VERBOSE, true)
        curl.setOpt(Curl.option.DEBUGFUNCTION, (infoType, content) => {
          if (infoType == 0) {
            console.log(Buffer.from(content).toString().trim())
          }
        })
      }

      if (typeof options.strictSSL === 'undefined' || options.strictSSL == true) {
        // Not set strictssl, default is true - verify that cert
        curl.setOpt('CAINFO', './cacert-2020-01-01.pem');
      } else {
        curl.setOpt('SSL_VERIFYPEER', false)
        curl.setOpt('SSL_VERIFYHOST', false)
        curl.setOpt('SSL_VERIFYSTATUS', false)
      }

      // Request method, defaults to GET
      curl.setOpt('CUSTOMREQUEST', options.method || 'GET')

      // Disable NPN/ALPN by default
      curl.setOpt("SSL_ENABLE_ALPN", false)
      curl.setOpt("SSL_ENABLE_NPN", false)

      // Default SSL off for https requests w/o cert


      // Handle gzip compression
      if (options.gzip) {
        curl.setOpt('ACCEPT_ENCODING', '')
      } else {
        curl.setOpt('HTTP_CONTENT_DECODING', '0')
      }

      // Timeout (ms)
      if (options.timeout) {
        curl.setOpt('TIMEOUT_MS')
      }

      // Forever (Handle connection reuse/not reuse)
      // Can be used for fingerprinting
      if (options.forever) {
        curl.setOpt('TCP_KEEPALIVE', 2)
        curl.setOpt('FORBID_REUSE', 0)
        curl.setOpt('FRESH_CONNECT', 0)
      } else {
        curl.setOpt('TCP_KEEPALIVE', 0)
        curl.setOpt('FORBID_REUSE', 2)
        curl.setOpt('FRESH_CONNECT', 1)
      }

      // Handle rebuilding URL
      // If false path will be rebuild `/../` can't be used as a directory name etc
      curl.setOpt('PATH_AS_IS', options.rebuild)

      // Post request form handling
      if (options.form) {
        const data = []
        const keys = Object.keys(options.form)

        for (let i in keys) {
          const key = keys[i]
          data.push(`${key}=${options.form[key]}`)
        }

        const fields = data.join('&')
        curl.setOpt('POSTFIELDS', fields)

        const caseless = Caseless(options.headers)

        // Append content-length header
        if (options.headers) {
          if (!caseless.get('content-type')) {
            caseless.set('content-type', 'application/x-www-form-urlencoded')
          }
        } else {
          options.headers = {
            'content-type': 'application/x-www-form-urlencoded'
          }
        }
      } else if (options.body) {
        const caseless = Caseless(options.headers)
        if (options.headers) {
          if (!caseless.get('content-type')) {
            caseless.set('content-type', 'application/json')
          }
        } else {
          options.headers = {
            'content-type': 'application/json'
          }
        }

        curl.setOpt("POSTFIELDS", JSON.stringify(options.body))
      }

      // HTTP2
      if (options.http2) {
        curl.setOpt('SSL_ENABLE_ALPN', true)
        curl.setOpt('HTTP_VERSION', 'CURL_HTTP_VERSION_2_0')
      } else {
        curl.setOpt('HTTP_VERSION', 'CURL_HTTP_VERSION_1_1')
      }

      const headers = []
      let hasCookieHeader = false

      if (typeof options.headers === 'object') {
        const caseless = Caseless(options.headers)
        for (const header in options.headers) {
          if (caseless.get('cookie')) {
            if (options.jar) {
              const cookiesInJar = options.jar.getCookieStringSync(options.uri)
              if (!cookiesInJar) {
                // Cookie jar is empty, just use cookies inside header
                headers.push(`${header}: ${options.headers[header]}`)
              } else {
                // TODO: maybe make cookies set in the header overwrite that of the jar
                headers.push(`${header}: ${options.headers[header]}; ${cookiesInJar}`)
              }
            } else {
              // Has cookie header but no jar, just append
              headers.push(`${header}: ${options.headers[header]}`)  
            }

            hasCookieHeader = true
          } else {
            headers.push(`${header}: ${options.headers[header]}`)  
          }
        }
      }

      if (!hasCookieHeader && options.jar) {
        // If there is no cookie header and has a jar, only append jar cookies
        const cookiesInJar = options.jar.getCookieStringSync(options.uri)
        headers.push(`cookie: ${cookiesInJar}`)
      }

      // Set the headers
      curl.setOpt('HTTPHEADER', headers)

      // Proxy support
      if (options.proxy) {
        curl.setOpt('PROXY', options.proxy)
      }

      // Disable cURL redirects because we handle them manually for cookiejars
      curl.setOpt("FOLLOWLOCATION", false)


      // Cipher suites
      if (options.ciphers) {
        curl.setOpt("SSL_CIPHER_LIST", options.ciphers)
      }


      curl.on("end", async function (statusCode, data, headers) {
        // Remove results header and compress into single object
        // IDK why Curl returns headers as an array, that's a problem for future me!
        const respHeaders = headers[headers.length - 1]
        delete respHeaders.result

        if (options.jar) {
          // Get host to set cookies to
          const parsedUrl = url.parse(options.uri)
          const host = `${parsedUrl.protocol}//${parsedUrl.host}/`

          // Append set cookie headers to the cookie jar (if using)
          const caseless = Caseless(respHeaders)

          if (caseless.get('set-cookie')) {
            caseless.get('set-cookie').forEach(function (c) {
              const cookie = c.split(';')[0]
              options.jar.setCookieSync(cookie, host)
            })
          }
        }

        if (options.followRedirects && curl.getInfo("REDIRECT_URL")) {
          options.redirectCount = options.redirectCount + 1 || 1
          if (options.redirectCount != options.maxRedirects) {
            // Use the same socket when following the redirect.
            options.forever = true
            options.uri = curl.getInfo("REDIRECT_URL")

            options.method = options.followMethod || options.method
            if (options.method == "GET") {
              // Delete form if following request is GET
              delete options.form
              delete options.body
            }

            this.close()
            return resolve(new Request(options))
          }
        }

        // Parse json if required
        if (options.json) {
          try {
            data = JSON.parse(data)
          } catch (err) {
            throw new Error(err)
          }
        }

        // Convert response into same format as request-promise
        let response = {
          body: data,
          headers: respHeaders,
          statusCode: statusCode,
        }

        // Close then resolve to prevent memory leaks
        this.close()
        resolve(response)
      })

      curl.on("error", function (err) {
        curl.close.bind(curl)
        this.close()
        reject(err)
      })

      // Execute
      curl.perform()
    })
  }
}

module.exports = Request