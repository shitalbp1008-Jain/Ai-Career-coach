// tailwind.config.mjs
const config = {
  content: [ /* <-- Check these paths carefully! */ ], 
  // ...
  experimental: {
    colorFunctions: false, // Must be present!
  },
};
export default config;