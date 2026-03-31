import * as esbuild from 'esbuild';

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
    outfile: 'dist/popup.js',
  },
];

if (watch) {
  for (const config of builds) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
  }
  console.log('Watching for changes...');
} else {
  for (const config of builds) {
    await esbuild.build(config);
  }
  console.log('Build complete.');
}
