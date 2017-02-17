
import fs from 'fs';
import path from 'path';

export default (server) => {
  function walk(pathToWalk) {
    fs.readdirSync(pathToWalk).forEach((file) => {
      const newPath = `${pathToWalk}/${file}`;
      const stat = fs.statSync(newPath);
      if (stat.isFile()) {
        if (/(.*)\.(js$|coffee$)/.test(file)) {
          /* eslint-disable global-require */
          /* eslint-disable import/no-dynamic-require */
          require(newPath).default(server);
          /* eslint-enable import/no-dynamic-require */
          /* eslint-enable global-require */
        }
      } else if (stat.isDirectory() && file !== 'middlewares') {
        walk(newPath);
      }
    });
  }

  // const routes_path = config.root + '/app/route';
  const rootPath = path.normalize(path.join(__dirname, '..'));
  const routesPath = `${rootPath}/restRoutes`;
  walk(routesPath);
};
