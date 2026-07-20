/**
 * Ambient module declarations so asset and stylesheet imports typecheck under
 * any bundler (Vite, webpack, etc.). The default export of an image import is
 * its resolved URL string.
 */
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.css";
