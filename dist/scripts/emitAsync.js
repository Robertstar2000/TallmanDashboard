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
 * Emits an event on the given emitter but executes
 * the listeners sequentially. This accounts for asynchronous
 * listeners (e.g. those having "sleep" and handling the request).
 */
export function emitAsync(emitter, eventName, ...data) {
    return __awaiter(this, void 0, void 0, function* () {
        const listners = emitter.listeners(eventName);
        if (listners.length === 0) {
            return;
        }
        for (const listener of listners) {
            yield listener.apply(emitter, data);
        }
    });
}
