var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import http from 'node:http';
import { HttpServer } from '@open-draft/test-server/http';
import { DeferredPromise } from '@open-draft/deferred-promise';
import { ClientRequestInterceptor } from '.';
import { sleep, waitForClientRequest } from '../../../test/helpers';
const httpServer = new HttpServer((app) => {
    app.get('/', (_req, res) => {
        res.status(200).send('/');
    });
    app.get('/get', (_req, res) => {
        res.status(200).send('/get');
    });
});
const interceptor = new ClientRequestInterceptor();
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    interceptor.apply();
    yield httpServer.listen();
}));
afterEach(() => {
    interceptor.removeAllListeners();
});
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    interceptor.dispose();
    yield httpServer.close();
}));
it('abort the request if the abort signal is emitted', () => __awaiter(void 0, void 0, void 0, function* () {
    const requestUrl = httpServer.http.url('/');
    interceptor.on('request', function delayedResponse(_a) {
        return __awaiter(this, arguments, void 0, function* ({ controller }) {
            yield sleep(1000);
            controller.respondWith(new Response());
        });
    });
    const abortController = new AbortController();
    const request = http.get(requestUrl, { signal: abortController.signal });
    abortController.abort();
    const abortErrorPromise = new DeferredPromise();
    request.on('error', function (error) {
        abortErrorPromise.resolve(error);
    });
    const abortError = yield abortErrorPromise;
    expect(abortError.name).toEqual('AbortError');
    expect(request.destroyed).toBe(true);
}));
it('patch the Headers object correctly after dispose and reapply', () => __awaiter(void 0, void 0, void 0, function* () {
    interceptor.dispose();
    interceptor.apply();
    interceptor.on('request', ({ controller }) => {
        const headers = new Headers({
            'X-CustoM-HeadeR': 'Yes',
        });
        controller.respondWith(new Response(null, { headers }));
    });
    const request = http.get(httpServer.http.url('/'));
    const { res } = yield waitForClientRequest(request);
    expect(res.rawHeaders).toEqual(expect.arrayContaining(['X-CustoM-HeadeR', 'Yes']));
    expect(res.headers['x-custom-header']).toEqual('Yes');
}));
