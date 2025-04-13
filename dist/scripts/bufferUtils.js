const encoder = new TextEncoder();
export function encodeBuffer(text) {
    return encoder.encode(text);
}
export function decodeBuffer(buffer, encoding) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
}
/**
 * Create an `ArrayBuffer` from the given `Uint8Array`.
 * Takes the byte offset into account to produce the right buffer
 * in the case when the buffer is bigger than the data view.
 */
export function toArrayBuffer(array) {
    return array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength);
}
