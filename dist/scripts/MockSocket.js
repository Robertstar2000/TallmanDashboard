import net from 'node:net';
import { normalizeSocketWriteArgs, } from './utils/normalizeSocketWriteArgs';
export class MockSocket extends net.Socket {
    constructor(options) {
        super();
        this.options = options;
        this.connecting = false;
        this.connect();
        this._final = (callback) => {
            callback(null);
        };
    }
    connect() {
        // The connection will remain pending until
        // the consumer decides to handle it.
        this.connecting = true;
        return this;
    }
    write(...args) {
        const [chunk, encoding, callback] = normalizeSocketWriteArgs(args);
        this.options.write(chunk, encoding, callback);
        return true;
    }
    end(...args) {
        const [chunk, encoding, callback] = normalizeSocketWriteArgs(args);
        this.options.write(chunk, encoding, callback);
        return super.end.apply(this, args);
    }
    push(chunk, encoding) {
        this.options.read(chunk, encoding);
        return super.push(chunk, encoding);
    }
}
