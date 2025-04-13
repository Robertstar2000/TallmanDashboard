/**
 * Concatenate two `Uint8Array` buffers.
 */
export function concatArrayBuffer(left, right) {
    const result = new Uint8Array(left.byteLength + right.byteLength);
    result.set(left, 0);
    result.set(right, left.byteLength);
    return result;
}
