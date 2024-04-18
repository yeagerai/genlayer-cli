module.exports = {
  require: ["ts-node/register"],
  extension: ["ts"],
  spec: "tests/**/*.ts",
  watchFiles: ["src/**/*.ts"],
  recursive: true,
  nodeOptions: ["--loader=ts-node/esm"],
};
