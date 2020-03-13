const { Curl } = require('node-libcurl')
const tough = require('tough-cookie')

const request = async (opts) => {
	return new Promise(async (resolve, reject) => {
		const curl = new Curl()

		curl.setOpt('CUSTOMREQUEST', opts.method || 'GET')
		curl.setOpt('ACCEPT_ENCODING', '')

		// URL parameter
		if (typeof opts.url === 'undefined') {
			throw new Error('Missing `url` parameter')
		} else {
			curl.setOpt('URL', opts.url)
		}

		// Set default request method to GET
		if (typeof opts.strictSSL !== 'undefined' && opts.strictSSL) {
			curl.setOpt('SSL_VERIFYPEER', true)
		} else {
			// Default, requests will fail without valid SSL certificate
			curl.setOpt('SSL_VERIFYPEER', false)
		}

		// Tunnel through proxy
		if (opts.tunnel) {
			curl.setOpt('HTTPPROXYTUNNEL', true)
		} else {
			curl.setOpt('HTTPPROXYTUNNEL', false)
		}

		// Rebuild path-dot-sequence /../ etc
		if (opts.rebuild) {
			curl.setOpt(Curl.option.PATH_AS_IS, false)
		} else if (typeof opts.rebuild == 'undefined') {
			curl.setOpt(Curl.option.PATH_AS_IS, true)
		} else {
			curl.setOpt(Curl.option.PATH_AS_IS, true)
		}

		// Form for POST requests
		if (opts.form) {
			const data = []
			const keys = Object.keys(opts.form)

			for (let i in keys) {
				const key = keys[i]
				data.push(`${key}=${opts.form[key]}`)
			}

			curl.setOpt('POSTFIELDS', data.join('&'))
		}

		// HTTP VERSION
		if (opts.http2) {
			curl.setOpt('HTTP_VERSION', 'CURL_HTTP_VERSION_2_0')
		}

		// Append headers to the request
		if (typeof opts.headers === 'object') {
			cookieHeaderExists = false
			const headers = []

			for (let header in opts.headers) {
				if (header.toLowerCase() == 'cookie') {
					if (opts.jar) {
						// Get their cookies from their current jar
						const jarCookies = opts.jar.getCookieStringSync(opts.url)

						// Append cookies from their header to the jar
						let cookies = ''
						if (jarCookies.length === 0) {
							cookies = opts.headers[header]
						} else {
							cookies = `${jarCookies}; ${opts.headers[header]}`
						}

						headers.push(`${header}: ${cookies}`)
					} else {
						// Not using a cookie jar, just use the header as it is.
						try {
							console.log("Using cookies in request.")
							const cookies = tough.Cookie.parse(opts.headers[header]).toString()
							headers.push(`${header}: ${cookies}`)
						} catch(err) {
							throw new Error(`Cookie error: ${err.message}`)
						}
					}

					cookieHeaderExists = true
				} else {
					headers.push(`${header}: ${opts.headers[header]}`)
				}
			}

			if (!cookieHeaderExists) {
				// If they don't have a cookie request-header and they use a jar, only use coookies from the jar.
				const cookies = opts.jar.getCookieStringSync(opts.url)
				headers.push(`cookie: ${cookies}`)
			}

			curl.setOpt(Curl.option.HTTPHEADER, headers)
		}

		// Proxy usage
		if (typeof opts.proxy !== 'undefined') {
			curl.setOpt('PROXY', opts.proxy)
		}

		// Cipher suites
		if (typeof opts.ciphers !== 'undefined') {
			if (typeof opts.ciphers === 'array') {
				curl.setOpt('SSL_CIPHER_LIST', opts.ciphers.join(' '))
			} else {
				curl.setOpt('SSL_CIPHER_LIST', opts.ciphers)
			}
		}

		// Follow redirects on 3XX requests
		if (typeof opts.followRedirects !== 'undefined') {
			curl.setOpt('FOLLOWLOCATION', opts.followRedirect)
		} else {
			// Default `true` as specified in request.js docs
			curl.setOpt('FOLLOWLOCATION', true)
		}

		// Max redirects to follow
		if (typeof opts.maxRedirects !== 'undefined') {
			curl.setOpt('MAXREDIRS', opts.maxRedirects)
		} else {
			// Default `10` according to request.js docs
			curl.setOpt('MAXREDIRS', 10)
		}

		curl.on('end', function (statusCode, data, headers) {
			// Remove results header and compress into single object
			const respHeaders = headers[(headers.length - 1)]
			const headerList = {}

			for (let header in respHeaders) {
				if (header != 'result') {
					headerList[header] = respHeaders[header]
				}
				
				if (header.toLowerCase() == 'set-cookie' && opts.jar) {
					console.log(respHeaders[header])
					// Append the set cookies to their jar if they are using
					respHeaders[header].forEach(el => {
						opts.jar.setCookieSync(el, opts.url)
					});
				}
			}

			// Parse JSON if needed
			let body = data
			if (opts.json) {
				body = JSON.parse(data)
			}

			// Create request.js similar-style response
			const response = {
				body: body,
				headers: headerList,
				statusCode: statusCode,
				time: this.getInfo('TOTAL_TIME')
			}

			this.close();
			resolve(response)
		});

		curl.on('error', function(err) {
				curl.close.bind(curl)
				reject(err)
		})

		curl.perform();
	})
}

request.jar = () => {
	return new tough.CookieJar();
}

module.exports = request

