const { Curl } = require('node-libcurl')

const request = {
    jar: () => {}
}

request.create = async (opts) => {
    return new Promise(async (resolve, reject) => {
        const curl = new Curl()

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
    
        curl.setOpt('CUSTOMREQUEST', opts.method || 'GET')
        curl.setOpt(Curl.option.ACCEPT_ENCODING, '')
    
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
    
            // Create request.js similar-style response
            const response = {
                body: data,
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



const opts = {
    url: 'https://www.sneakersnstuff.com/',
    method: 'GET',
    headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,pl;q=0.8',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-fetch-mode': 'navigation',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
    },
    http2: true,
    // proxy: 'http://cvcuh:hosobgoqoq@45.146.222.95:3128',
    ciphers: 'NULL-SHA256 AES128-SHA256 AES256-SHA256 AES128-GCM-SHA256 AES256-GCM-SHA384 DH-RSA-AES128-SHA256 DH-RSA-AES256-SHA256 DH-RSA-AES128-GCM-SHA256 DH-RSA-AES256-GCM-SHA384 DH-DSS-AES128-SHA256 DH-DSS-AES256-SHA256 DH-DSS-AES128-GCM-SHA256 DH-DSS-AES256-GCM-SHA384 DHE-RSA-AES128-SHA256 DHE-RSA-AES256-SHA256 DHE-RSA-AES128-GCM-SHA256 DHE-RSA-AES256-GCM-SHA384 DHE-DSS-AES128-SHA256 DHE-DSS-AES256-SHA256 DHE-DSS-AES128-GCM-SHA256 DHE-DSS-AES256-GCM-SHA384 ECDHE-RSA-AES128-SHA256 ECDHE-RSA-AES256-SHA384 ECDHE-RSA-AES128-GCM-SHA256 ECDHE-RSA-AES256-GCM-SHA384 ECDHE-ECDSA-AES128-SHA256 ECDHE-ECDSA-AES256-SHA384 ECDHE-ECDSA-AES128-GCM-SHA256 ECDHE-ECDSA-AES256-GCM-SHA384 ADH-AES128-SHA256 ADH-AES256-SHA256 ADH-AES128-GCM-SHA256 ADH-AES256-GCM-SHA384 AES128-CCM AES256-CCM DHE-RSA-AES128-CCM DHE-RSA-AES256-CCM AES128-CCM8 AES256-CCM8 DHE-RSA-AES128-CCM8 DHE-RSA-AES256-CCM8 ECDHE-ECDSA-AES128-CCM ECDHE-ECDSA-AES256-CCM ECDHE-ECDSA-AES128-CCM8 ECDHE-ECDSA-AES256-CCM8',
    strictSSL: true,
    followRedirects: false,
    maxRedirects: 1,
    // jar: true
}

async function start() {
    const x = await request.create(opts)
    console.log(x)
}

start()



module.exports = request