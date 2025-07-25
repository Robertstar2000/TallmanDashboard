export class AddressError extends Error {
    constructor(message, parseMessage) {
        super(message);
        this.name = 'AddressError';
        if (parseMessage !== null) {
            this.parseMessage = parseMessage;
        }
    }
}
