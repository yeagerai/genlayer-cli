const esbuild = require("esbuild");

const run = async () => {
  // Start build with esbuild
  const context = await esbuild.context({
    tsconfig: "./tsconfig.json",
    entryPoints: ["src/index.ts"],
    bundle: true, // Bundle all dependencies
    outfile: "dist/index.js", // Output file
    platform: "node",
    target: "es6",
  });

  await context.watch();
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
