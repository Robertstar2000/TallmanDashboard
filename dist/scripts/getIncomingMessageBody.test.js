var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { it, expect } from 'vitest';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import * as zlib from 'zlib';
import { getIncomingMessageBody } from './getIncomingMessageBody';
it('returns utf8 string given a utf8 response body', () => __awaiter(void 0, void 0, void 0, function* () {
    const utfBuffer = Buffer.from('one');
    const message = new IncomingMessage(new Socket());
    const pendingResponseBody = getIncomingMessageBody(message);
    message.emit('data', utfBuffer);
    message.emit('end');
    expect(yield pendingResponseBody).toEqual('one');
}));
it('returns utf8 string given a gzipped response body', () => __awaiter(void 0, void 0, void 0, function* () {
    const utfBuffer = zlib.gzipSync(Buffer.from('two'));
    const message = new IncomingMessage(new Socket());
    message.headers = {
        'content-encoding': 'gzip',
    };
    const pendingResponseBody = getIncomingMessageBody(message);
    message.emit('data', utfBuffer);
    message.emit('end');
    expect(yield pendingResponseBody).toEqual('two');
}));
it('returns utf8 string given a gzipped response body with incorrect "content-lenght"', () => __awaiter(void 0, void 0, void 0, function* () {
    const utfBuffer = zlib.gzipSync(Buffer.from('three'));
    const message = new IncomingMessage(new Socket());
    message.headers = {
        'content-encoding': 'gzip',
        'content-length': '500',
    };
    const pendingResponseBody = getIncomingMessageBody(message);
    message.emit('data', utfBuffer);
    message.emit('end');
    expect(yield pendingResponseBody).toEqual('three');
}));
it('returns empty string given an empty body', () => __awaiter(void 0, void 0, void 0, function* () {
    const message = new IncomingMessage(new Socket());
    const pendingResponseBody = getIncomingMessageBody(message);
    message.emit('end');
    expect(yield pendingResponseBody).toEqual('');
}));
