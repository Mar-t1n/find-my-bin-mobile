// jpeg-js ships no TypeScript types; this declares the minimal surface we use.
declare module 'jpeg-js' {
  export interface RawImageData {
    width: number;
    height: number;
    // RGBA, 4 bytes per pixel.
    data: Uint8Array;
  }

  export interface DecodeOptions {
    useTArray?: boolean;
    formatAsRGBA?: boolean;
  }

  export function decode(jpegData: Uint8Array | ArrayBuffer, options?: DecodeOptions): RawImageData;
}
