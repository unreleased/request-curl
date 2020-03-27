const curl = require('node-curl')

curl('www.google.com', {VERBOSE: 1, RAW: 1}, function(err) {
    console.info(this);
});