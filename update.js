const fs = require('fs');
const unzipper = require('unzipper');

fs.createReadStream('updates/update.zip')
    .pipe(unzipper.Extract({ path: __dirname }))
    .on('error', function(e) {
        console.log(e);
    });
