export async function decodeCanvas(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const bytesLength = bytes.length;
  // Each byte represents two pixels side-by-side, so we need to convert it to a pixel array.
  const pixels = new Uint8Array(bytes.length * 2);

  for (let i = 0; i < bytesLength; i++) {
    pixels[i * 2] = bytes[i] >> 4;
    pixels[i * 2 + 1] = bytes[i] & 0b00001111;
  }
  return pixels;
}
