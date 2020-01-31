const { Curl } = require('node-libcurl')

const request = {
    jar: () => {}
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
    
        // HTTP VERSION
        if (opts.http2) {
            curl.setOpt('HTTP_VERSION', 'CURL_HTTP_VERSION_2_0')
        }
    
        // Append headers to the request
        if (typeof opts.headers === 'object') {
            const headers = []
            for (let header in opts.headers) {
                headers.push(`${header}: ${opts.headers[header]}`)
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
        if (typeof opts.followRedirect !== 'undefined') {
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
            const headerList = {}
            for (let header in headers[0]) {
                if (header != 'result') {
                    headerList[header] = headers[0][header]
                }
            }

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

module.exports = request

