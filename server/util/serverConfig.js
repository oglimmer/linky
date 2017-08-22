
let rest = 'none'; // enable|proxy|none
let distResources = 'none'; // enable|none
let ejsPathConfig = 'none'; // dist|static|none
let dynamicContent = 'none'; // enable|none
let staticResources = 'none'; // enable|none
let dynamicBundleGeneration = 'none'; // enable|none

let portConfig = process.env.PORT || '8080';
// see /src/util/fetch.js
let restApiPortConfig = process.env.REST_API_PORT || process.env.PORT || '8080';

if (process.env.RUNCFG) {
  console.log(`Using RUNCFG = ${process.env.RUNCFG}`);
}
if (process.env.RUNCFG === 'DEV-WEB') {
  rest = 'proxy';
  ejsPathConfig = 'static';
  dynamicContent = 'enable';
  staticResources = 'enable';
  dynamicBundleGeneration = 'enable';
} else if (process.env.RUNCFG === 'DEV-REST') {
  rest = 'enable';
  portConfig = '8081';
} else if (process.env.RUNCFG === 'DEV') {
  rest = 'enable';
  ejsPathConfig = 'static';
  dynamicContent = 'enable';
  staticResources = 'enable';
  dynamicBundleGeneration = 'enable';
} else if (process.env.RUNCFG === 'PROD') {
  rest = 'enable';
  distResources = 'enable';
  ejsPathConfig = 'dist';
  dynamicContent = 'enable';
} else if (process.env.RUNCFG === 'PROD-REST') {
  rest = 'enable';
  portConfig = '8081';
} else if (process.env.RUNCFG === 'PROD-STATIC') {
  distResources = 'enable';
  portConfig = '8082';
} else if (process.env.RUNCFG === 'PROD-PAGE-GEN') {
  ejsPathConfig = 'dist';
  dynamicContent = 'enable';
  restApiPortConfig = '8081';
}

if (process.env.REST) {
  rest = process.env.REST;
}
if (process.env.DIST_RESOURCES) {
  distResources = process.env.DIST_RESOURCES;
}
if (process.env.EJS_PATH) {
  ejsPathConfig = process.env.EJS_PATH;
}
if (process.env.DYNAMIC_CONTENT) {
  dynamicContent = process.env.DYNAMIC_CONTENT;
}
if (process.env.STATIC_RESOURCES) {
  staticResources = process.env.STATIC_RESOURCES;
}
if (process.env.DYNAMIC_BUNDLE_GENERATION) {
  dynamicBundleGeneration = process.env.DYNAMIC_BUNDLE_GENERATION;
}

process.env.INTERNAL_REST_API_PORT = restApiPortConfig;

let ejsPath = '$unset$';
if (ejsPathConfig === 'dist') {
  ejsPath = '../dist/static';
} else if (ejsPathConfig === 'static') {
  ejsPath = '../dynamic-resources';
} else if (ejsPathConfig !== 'none') {
  throw new Error('Illegal config for ejsPathConfig');
}

// console.log(`Using REST = ${rest}`);
// console.log(`Using DIST_RESOURCES = ${distResources}`);
// console.log(`Using EJS_PATH = ${ejsPath}`);
// console.log(`Using DYNAMIC_CONTENT = ${dynamicContent}`);
// console.log(`Using STATIC_RESOURCES = ${staticResources}`);
// console.log(`Using DYNAMIC_BUNDLE_GENERATION = ${dynamicBundleGeneration}`);
// console.log(`Using portConfig = ${portConfig}`);
// console.log(`Using restApiPortConfig = ${restApiPortConfig}`);

export const bind = process.env.BIND || '127.0.0.1';
export const port = portConfig;
export const restApiPort = restApiPortConfig;
export const compConfigRest = rest;
export const compConfigDistResources = distResources;
export const compConfigEjsPath = ejsPath;
export const compConfigDynamicContent = dynamicContent;
export const compConfigStaticResources = staticResources;
export const compConfigDynamicBundleGeneration = dynamicBundleGeneration;
