
// const config = require('./config');

const fs = require('fs');
const path = require('path');

module.exports = (server) => {
  function walk(pathToWalk) {
    fs.readdirSync(pathToWalk).forEach((file) => {
      const newPath = `${pathToWalk}/${file}`;
      const stat = fs.statSync(newPath);
      if (stat.isFile()) {
        if (/(.*)\.(js$|coffee$)/.test(file)) {
          /* eslint-disable global-require */
          require(newPath)(server);
          /* eslint-enable global-require */
        }
      } else if (stat.isDirectory() && file !== 'middlewares') {
        walk(newPath);
      }
    });
  }

  // const routes_path = config.root + '/app/route';
  const rootPath = path.normalize(path.join(__dirname, '/..'));
  const routesPath = `${rootPath}/app/route`;
  walk(routesPath);
};
