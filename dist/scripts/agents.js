import http from 'node:http';
import https from 'node:https';
import { MockHttpSocket, } from './MockHttpSocket';
export class MockAgent extends http.Agent {
    constructor(options) {
        super();
        this.customAgent = options.customAgent;
        this.onRequest = options.onRequest;
        this.onResponse = options.onResponse;
    }
    createConnection(options, callback) {
        const createConnection = this.customAgent instanceof http.Agent
            ? this.customAgent.createConnection
            : super.createConnection;
        const createConnectionOptions = this.customAgent instanceof http.Agent
            ? Object.assign(Object.assign({}, options), this.customAgent.options) : options;
        const socket = new MockHttpSocket({
            connectionOptions: options,
            createConnection: createConnection.bind(this.customAgent || this, createConnectionOptions, callback),
            onRequest: this.onRequest.bind(this),
            onResponse: this.onResponse.bind(this),
        });
        return socket;
    }
}
export class MockHttpsAgent extends https.Agent {
    constructor(options) {
        super();
        this.customAgent = options.customAgent;
        this.onRequest = options.onRequest;
        this.onResponse = options.onResponse;
    }
    createConnection(options, callback) {
        const createConnection = this.customAgent instanceof https.Agent
            ? this.customAgent.createConnection
            : super.createConnection;
        const createConnectionOptions = this.customAgent instanceof https.Agent
            ? Object.assign(Object.assign({}, options), this.customAgent.options) : options;
        const socket = new MockHttpSocket({
            connectionOptions: options,
            createConnection: createConnection.bind(this.customAgent || this, createConnectionOptions, callback),
            onRequest: this.onRequest.bind(this),
            onResponse: this.onResponse.bind(this),
        });
        return socket;
    }
}
