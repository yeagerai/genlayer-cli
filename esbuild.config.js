/* eslint-disable no-undef -- Allow process and console in ignored file */

import esbuild from "esbuild";

const isProduction = process.env.NODE_ENV === "production";
const config = isProduction
  ? await import("./esbuild.config.prod.js")
  : await import("./esbuild.config.dev.js");

const run = async () => {
  if (config.default.watch) {
    const context = await esbuild.context(config.default.context);
    await context.watch();
  } else {
    await esbuild.build(config.default.context);
  }
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
