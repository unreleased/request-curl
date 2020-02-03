const { Curl } = require('node-libcurl')

const request = {
    jar: () => {
        request.jars.push({})
        const id  = request.jars.length - 1
        const jar = request.jars[id]
        return id
    },
    jars: []
}


request.parseCookieString = (cookieString) => {
    let cookies = cookieString
    if (cookieString.includes('; ')) {
        cookies = cookieString.split('; ')
    }

    const cookieObj = {}

    for (let i in cookies) {
        const cookie = cookies[i]
        if (cookie == '') break

        const key = cookie.split('=')[0]
        const val = cookie.split('=')[1]
        cookieObj[key] = val
    }

    return cookieObj
}

request.jarToString = (id) => {
    const jar = request.jars[id]
    const cookies = []

    for (let key in jar) {
        cookies.push(`${key}=${jar[key]}`)
    }
    
    return cookies.join('; ')
}

request.create = async (opts) => {
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
            const headers = []

            for (let header in opts.headers) {
                // Cookie header will override duplicate values in cookie jar. 
                if (header.toLowerCase() == 'cookie') {
                    const userSetCookies = request.parseCookieString(opts.headers[header])

                    if (opts.jar >= 0) {
                        // If user manually sets a cookie. Override it
                        for (let i in userSetCookies) {
                            request.jars[opts.jar][i] = userSetCookies[i]
                        }
                        headers.push(`${header}: ${request.jarToString(opts.jar)}`)

                    } else {
                        headers.push(`${header}: ${opts.headers[header]}`)
                    }
                } else {
                    headers.push(`${header}: ${opts.headers[header]}`)
                }
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
            let cookieString = ''
            const cookies = {}
            const respHeaders = headers[(headers.length - 1)]

            const headerList = {}
            for (let header in respHeaders) {
                if (header != 'result') {
                    headerList[header] = respHeaders[header]
                }

                if (header.toLowerCase() == 'set-cookie') {
                    for (let i in respHeaders[header]) {
                        const cookie = respHeaders[header][i]
                        const key    = cookie.split('=')[0]
                        const value  = cookie.split('=')[1].split(';')[0]
                        cookies[key] = value

                        // Create string cookie to easily be passed between requests
                        cookieString += `${key}=${value}; `

                        // Append cookie to jar if active
                        if (opts.jar >= 0) {
                            request.jars[opts.jar][key] = value
                        }
                    }
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
                cookies: cookies,
                cookieString: cookieString,
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

module.exports = request

