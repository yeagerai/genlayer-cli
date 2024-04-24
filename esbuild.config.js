const esbuild = require("esbuild");
const isProduction = process.env.NODE_ENV === "production";
const config = require(isProduction ? "./esbuild.config.prod" : "./esbuild.config.dev");

const run = async () => {
  if (config.watch) {
    const context = await esbuild.context(config.context);
    await context.watch();
  } else {
    await esbuild.build(config.context);
  }
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
