var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Return a total byte length of the given request/response body.
 * If the `Content-Length` header is present, it will be used as the byte length.
 */
export function getBodyByteLength(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const explicitContentLength = input.headers.get('content-length');
        if (explicitContentLength != null && explicitContentLength !== '') {
            return Number(explicitContentLength);
        }
        const buffer = yield input.arrayBuffer();
        return buffer.byteLength;
    });
}
