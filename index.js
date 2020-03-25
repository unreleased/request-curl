const {
	Curl
} = require('node-libcurl')
const tough = require('tough-cookie')
const deepmerge = require('deepmerge');

let request = {
	defaults: {},
}

request = async (opts) => {
	// Handle defaults, prevent deepmerge from breaking the cookiejar.
	requestOpts = opts
	if (request.defaults) {
		opts = deepmerge(request.defaults, opts)
		if (opts.jar) {
			opts.jar = requestOpts.jar
		}
	}

	return new Promise(async (resolve, reject) => {
		const curl = new Curl()

		// Uncomment for debugging requests
		// curl.setOpt('VERBOSE', 1)


		// A few default values.
		curl.setOpt('CUSTOMREQUEST', opts.method || 'GET')
		curl.setOpt('ACCEPT_ENCODING', '')

		/**
		 * Disable NPN (Older) and enable ALPN (More modern)
		 * This can be hugely problematic as I believe on Linux/MacOS systems it tries to use both which isn't browser-like
		 * and can be detected.
		 */

		curl.setOpt('SSL_ENABLE_ALPN', true)
        curl.setOpt('SSL_ENABLE_NPN', false)

		/**
		 * url: String
		 * The host you wish to make a request to.
		 * This should include:
		 * - A protocol (http/https)
		 * - A host or IP (93.184.216.34 / www.example.com)
		 * - A path (/example)
		 * - Constructed it should look like: https://www.example.com/page/
		 */

		if (typeof opts.url === 'undefined') {
			throw new Error('Missing `url` parameter')
		} else {
			curl.setOpt('URL', opts.url)
		}



		/**
		 * TODO: Add notes
		 */

		if (typeof opts.strictSSL !== 'undefined' && opts.strictSSL) {
			curl.setOpt('SSL_VERIFYPEER', true)
		} else {
			// Default, requests will fail without valid SSL certificate
			curl.setOpt('SSL_VERIFYPEER', false)
		}

		/**
		 * timeout: int(ms)
		 * Kill the socket attempting to connect after X milliseconds
		 */

		if (opts.timeout) {
			curl.setOpt(Curl.option.TIMEOUT_MS, opts.timeout)
		}


		/**
		 * forever: boolean
		 * Keeps the TCP connection open allowing request re-use.
		 * To the best of my knowledge sites CAN detect when you are reusing a socket
		 */

		if (opts.forever) {
			curl.setOpt(Curl.option.TCP_KEEPALIVE, 2)
			curl.setOpt(Curl.option.FORBID_REUSE, 0)
		} else {
			curl.setOpt(Curl.option.TCP_KEEPALIVE, 0)
			curl.setOpt(Curl.option.FORBID_REUSE, 2)

		}

		// Tunnel through proxy
		if (opts.tunnel) {
			curl.setOpt('HTTPPROXYTUNNEL', true)
		} else {
			curl.setOpt('HTTPPROXYTUNNEL', false)
		}

		/**
		 * rebuild: boolean
		 * Whether or not to squash the path-sequencing. Can be used to send unsquished http requests
		 * 
		 * Example URL: https://www.example.com/dir/../file.php
		 * rebuild: false | URL is squashed to: https://www.example.com/file.php
		 * rebuild: true | URL isn't changed: https://www.example.com/dir/../file.php
		 */

		if (opts.rebuild) {
			curl.setOpt(Curl.option.PATH_AS_IS, false)
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
		} else if (opts.method && ["POST", "PATCH"].includes(opts.method.toUpperCase()) && (opts.json || opts.jsonPost) && opts.body) {
			curl.setOpt('POSTFIELDS', JSON.stringify(opts.body));
		} else if(opts.method && ["POST", "PATCH"].includes(opts.method.toUpperCase()) && opts.headers && Object.keys(opts.headers).map(x => x.toLowerCase()).includes("content-type")) {
			curl.setOpt('POSTFIELDS', opts.body);
		}

		/**
		 * http2: boolean
		 * Whether or not to use HTTP2 when making the HTTP request.
		 */

		if (opts.http2) {
			curl.setOpt('HTTP_VERSION', 'CURL_HTTP_VERSION_2_0')
		} else {
			curl.setOpt('HTTP_VERSION', 'CURL_HTTP_VERSION_1_1')
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
							const cookies = tough.Cookie.parse(opts.headers[header]).toString()
							headers.push(`${header}: ${cookies}`)
						} catch (err) {
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
				if (opts.jar) {
					const cookies = opts.jar.getCookieStringSync(opts.url)
					headers.push(`cookie: ${cookies}`)
				}
			}

			if(opts.method && ["POST", "PATCH"].includes(opts.method.toUpperCase()) && (opts.json || opts.jsonPost)) {
				headers.push(`content-type: application/json`);
				headers.push(`content-length: ${JSON.stringify(opts.body).length}`);
			}
			curl.setOpt(Curl.option.HTTPHEADER, headers);
		} else {
			let headers = [];
			if(opts.method && ["POST", "PATCH"].includes(opts.method.toUpperCase()) (opts.json || opts.jsonPost)) {
				headers.push(`content-type: application/json`);
				headers.push(`content-length: ${JSON.stringify(opts.body).length}`);
			}

			curl.setOpt(Curl.option.HTTPHEADER, headers)
		}

		// Proxy usage
		if (typeof opts.proxy !== 'undefined') {
			curl.setOpt('PROXY', opts.proxy)
		}

		/**
		 * ciphers: array || string
		 * Cipher suites to be suggest during the TLS negotiation
		 */

		if (typeof opts.ciphers !== 'undefined') {
			if (typeof opts.ciphers === 'array') {
				curl.setOpt('SSL_CIPHER_LIST', opts.ciphers.join(' '))
			} else {
				curl.setOpt('SSL_CIPHER_LIST', opts.ciphers)
			}
		}

		// Disable cURL redirects because they're handled manually.
		curl.setOpt('FOLLOWLOCATION', false)

		curl.on('end', function (statusCode, data, headers) {
			// Remove results header and compress into single object
			const respHeaders = headers[(headers.length - 1)]
			const headerList = {}

			for (let header in respHeaders) {
				if (header != 'result') {
					headerList[header] = respHeaders[header]
				}

				// Append the set cookies to their jar if they are using
				if (header.toLowerCase() == 'set-cookie' && opts.jar) {
					respHeaders[header].forEach(el => {
						opts.jar.setCookieSync(el, opts.url)
					});
				}
			}

			// Handle redirect following manually to use tough-cookie to set new cookies from 3XX responses.
			if (opts.followRedirects && curl.getInfo("REDIRECT_URL")) {
				opts.redirectCount = (opts.redirectCount + 1) || 1
				if (opts.redirectCount != opts.maxRedirects) {
					// Use the same socket when following the redirect.
					opts.forever = true
					opts.url = curl.getInfo("REDIRECT_URL")
					this.close();
					return resolve(request(opts))
				}
			}

			// Parse JSON if needed
			let body = data
			if (opts.json) {
				body = JSON.parse(data)
			}

			// Create request.js similar-style response
			let response = {
				body: body,
				headers: headerList,
				statusCode: statusCode
			}

			if (opts.additionalInfo) {
				let additionalInfoObject = {
					finalUrl: opts.url,
					time: this.getInfo('TOTAL_TIME')
				}

				Object.assign(response, additionalInfoObject);
			}

			this.close();
			resolve(response)
		});

		curl.on('error', function (err) {
			curl.close.bind(curl)
			reject(err)
		})

		curl.perform();
	})
}

request.jar = () => {
	return new tough.CookieJar();
}

request.defaults = (defaults = {}) => {
	const req = request;
	req.defaults = defaults

	return req
}

module.exports = request