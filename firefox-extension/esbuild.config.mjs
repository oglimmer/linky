import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';

const watch = process.argv.includes('--watch');

const common = {
  bundle: true,
  format: 'iife',
  target: 'firefox115',
  sourcemap: false,
  minify: !watch,
};

const builds = [
  {
    ...common,
    entryPoints: ['src/background.js'],
    outfile: 'dist/background.js',
  },
  {
    ...common,
    entryPoints: ['src/content.js'],
    outfile: 'dist/content.js',
  },
  {
    ...common,
    entryPoints: ['src/popup/popup.js'],
    outfile: 'dist/popup/popup.js',
  },
];

// Copy static assets to dist
function copyStaticAssets() {
  mkdirSync('dist/popup', { recursive: true });
  copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
  copyFileSync('src/popup/popup.css', 'dist/popup/popup.css');
}

if (watch) {
  copyStaticAssets();
  for (const config of builds) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
  }
  console.log('Watching for changes...');
} else {
  for (const config of builds) {
    await esbuild.build(config);
  }
  copyStaticAssets();
  console.log('Build complete.');
}
