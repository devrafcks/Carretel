const config = {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: { overrides: { cleanupIds: false, removeUnknownsAndDefaults: false, removeTitle: false } },
    },
    "removeDimensions",
  ],
};

export default config;
