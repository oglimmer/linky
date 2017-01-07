'use strict';

//const config = require('./config');
const fs = require('fs');
const path = require('path');

module.exports = function(server) {
   
    function walk(path) {
        fs.readdirSync(path).forEach(file => {
            const newPath = path + '/' + file;
            const stat = fs.statSync(newPath);
            if (stat.isFile()) {
                if (/(.*)\.(js$|coffee$)/.test(file)) {
                    require(newPath)(server);
                }
            } else if (stat.isDirectory() && file !== 'middlewares') {
                walk(newPath);
            }
        });
    };

    //const routes_path = config.root + '/app/route';
    const rootPath = path.normalize(__dirname + '/..');
    const routes_path = rootPath + '/app/route';    
    walk(routes_path);
}
