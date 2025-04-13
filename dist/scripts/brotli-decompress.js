var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import zlib from 'node:zlib';
export class BrotliDecompressionStream extends TransformStream {
    constructor() {
        const decompress = zlib.createBrotliDecompress({
            flush: zlib.constants.BROTLI_OPERATION_FLUSH,
            finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
        });
        super({
            transform(chunk, controller) {
                return __awaiter(this, void 0, void 0, function* () {
                    const buffer = Buffer.from(chunk);
                    const decompressed = yield new Promise((resolve, reject) => {
                        decompress.write(buffer, (error) => {
                            if (error)
                                reject(error);
                        });
                        decompress.flush();
                        decompress.once('data', (data) => resolve(data));
                        decompress.once('error', (error) => reject(error));
                        decompress.once('end', () => controller.terminate());
                    }).catch((error) => {
                        controller.error(error);
                    });
                    controller.enqueue(decompressed);
                });
            },
        });
    }
}
