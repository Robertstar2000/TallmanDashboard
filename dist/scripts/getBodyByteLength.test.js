var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @vitest-environment node
import { it, expect } from 'vitest';
import { getBodyByteLength } from './getBodyByteLength';
const url = 'http://localhost';
it('returns explicit body length set in the "Content-Length" header', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Request(url, { headers: { 'Content-Length': '10' } }))).resolves.toBe(10);
    yield expect(getBodyByteLength(new Response('hello', { headers: { 'Content-Length': '5' } }))).resolves.toBe(5);
}));
/**
 * Request.
 */
it('returns 0 for a request with an empty body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Request(url))).resolves.toBe(0);
    yield expect(getBodyByteLength(new Request(url, { method: 'POST', body: null }))).resolves.toBe(0);
    yield expect(getBodyByteLength(new Request(url, { method: 'POST', body: undefined }))).resolves.toBe(0);
    yield expect(getBodyByteLength(new Request(url, { method: 'POST', body: '' }))).resolves.toBe(0);
}));
it('calculates body length from the text request body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Request(url, {
        method: 'POST',
        body: 'hello world',
    }))).resolves.toBe(11);
}));
it('calculates body length from the URLSearchParams request body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Request(url, {
        method: 'POST',
        body: new URLSearchParams([['hello', 'world']]),
    }))).resolves.toBe(11);
}));
it('calculates body length from the Blob request body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Request(url, {
        method: 'POST',
        body: new Blob(['hello world']),
    }))).resolves.toBe(11);
}));
it('calculates body length from the ArrayBuffer request body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Request(url, {
        method: 'POST',
        body: yield new Blob(['hello world']).arrayBuffer(),
    }))).resolves.toBe(11);
}));
it('calculates body length from the FormData request body', () => __awaiter(void 0, void 0, void 0, function* () {
    const formData = new FormData();
    formData.append('hello', 'world');
    yield expect(getBodyByteLength(new Request(url, {
        method: 'POST',
        body: formData,
    }))).resolves.toBe(127);
}));
it('calculates body length from the ReadableStream request body', () => __awaiter(void 0, void 0, void 0, function* () {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('hello world'));
            controller.close();
        },
    });
    yield expect(getBodyByteLength(new Request(url, {
        method: 'POST',
        body: stream,
        // @ts-expect-error Undocumented required Undici property.
        duplex: 'half',
    }))).resolves.toBe(11);
}));
/**
 * Response.
 */
it('returns 0 for a response with an empty body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Response())).resolves.toBe(0);
    yield expect(getBodyByteLength(new Response(null))).resolves.toBe(0);
    yield expect(getBodyByteLength(new Response(undefined))).resolves.toBe(0);
    yield expect(getBodyByteLength(new Response(''))).resolves.toBe(0);
}));
it('calculates body length from the text response body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Response('hello world'))).resolves.toBe(11);
}));
it('calculates body length from the URLSearchParams response body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Response(new URLSearchParams([['hello', 'world']])))).resolves.toBe(11);
}));
it('calculates body length from the Blob response body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Response(new Blob(['hello world'])))).resolves.toBe(11);
}));
it('calculates body length from the ArrayBuffer response body', () => __awaiter(void 0, void 0, void 0, function* () {
    yield expect(getBodyByteLength(new Response(yield new Blob(['hello world']).arrayBuffer()))).resolves.toBe(11);
}));
it('calculates body length from the FormData response body', () => __awaiter(void 0, void 0, void 0, function* () {
    const formData = new FormData();
    formData.append('hello', 'world');
    yield expect(getBodyByteLength(new Response(formData))).resolves.toBe(127);
}));
it('calculates body length from the ReadableStream response body', () => __awaiter(void 0, void 0, void 0, function* () {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('hello world'));
            controller.close();
        },
    });
    yield expect(getBodyByteLength(new Response(stream))).resolves.toBe(11);
}));
