import Ajv from "../core";
import standaloneCode from ".";
import * as requireFromString from "require-from-string";
export default class AjvPack {
    constructor(ajv) {
        this.ajv = ajv;
    }
    validate(schemaKeyRef, data) {
        return Ajv.prototype.validate.call(this, schemaKeyRef, data);
    }
    compile(schema, meta) {
        return this.getStandalone(this.ajv.compile(schema, meta));
    }
    getSchema(keyRef) {
        const v = this.ajv.getSchema(keyRef);
        if (!v)
            return undefined;
        return this.getStandalone(v);
    }
    getStandalone(v) {
        return requireFromString(standaloneCode(this.ajv, v));
    }
    addSchema(...args) {
        this.ajv.addSchema.call(this.ajv, ...args);
        return this;
    }
    addKeyword(...args) {
        this.ajv.addKeyword.call(this.ajv, ...args);
        return this;
    }
}
