module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Required for AWS SDK v3 - supports static class blocks
      "@babel/plugin-transform-class-static-block",
    ],
  };
};
