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
import { kResponsePromise, RequestController } from './RequestController';
it('creates a pending response promise on construction', () => {
    const controller = new RequestController(new Request('http://localhost'));
    expect(controller[kResponsePromise]).toBeInstanceOf(Promise);
    expect(controller[kResponsePromise].state).toBe('pending');
});
it('resolves the response promise with the response provided to "respondWith"', () => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new RequestController(new Request('http://localhost'));
    controller.respondWith(new Response('hello world'));
    const response = (yield controller[kResponsePromise]);
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(yield response.text()).toBe('hello world');
}));
it('resolves the response promise with the error provided to "errorWith"', () => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new RequestController(new Request('http://localhost'));
    const error = new Error('Oops!');
    controller.errorWith(error);
    yield expect(controller[kResponsePromise]).resolves.toEqual(error);
}));
it('throws when calling "respondWith" multiple times', () => {
    const controller = new RequestController(new Request('http://localhost'));
    controller.respondWith(new Response('hello world'));
    expect(() => {
        controller.respondWith(new Response('second response'));
    }).toThrow('Failed to respond to the "GET http://localhost/" request: the "request" event has already been handled.');
});
it('throws when calling "errorWith" multiple times', () => {
    const controller = new RequestController(new Request('http://localhost'));
    controller.errorWith(new Error('Oops!'));
    expect(() => {
        controller.errorWith(new Error('second error'));
    }).toThrow('Failed to error the "GET http://localhost/" request: the "request" event has already been handled.');
});
