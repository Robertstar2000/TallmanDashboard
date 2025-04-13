export class InterceptorError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InterceptorError';
        Object.setPrototypeOf(this, InterceptorError.prototype);
    }
}
