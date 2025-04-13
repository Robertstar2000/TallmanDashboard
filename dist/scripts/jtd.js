import AjvCore from "./core";
import jtdVocabulary from "./vocabularies/jtd";
import jtdMetaSchema from "./refs/jtd-schema";
import compileSerializer from "./compile/jtd/serialize";
import compileParser from "./compile/jtd/parse";
const META_SCHEMA_ID = "JTD-meta-schema";
export class Ajv extends AjvCore {
    constructor(opts = {}) {
        super(Object.assign(Object.assign({}, opts), { jtd: true }));
    }
    _addVocabularies() {
        super._addVocabularies();
        this.addVocabulary(jtdVocabulary);
    }
    _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        if (!this.opts.meta)
            return;
        this.addMetaSchema(jtdMetaSchema, META_SCHEMA_ID, false);
    }
    defaultMeta() {
        return (this.opts.defaultMeta =
            super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
    }
    compileSerializer(schema) {
        const sch = this._addSchema(schema);
        return sch.serialize || this._compileSerializer(sch);
    }
    compileParser(schema) {
        const sch = this._addSchema(schema);
        return (sch.parse || this._compileParser(sch));
    }
    _compileSerializer(sch) {
        compileSerializer.call(this, sch, sch.schema.definitions || {});
        /* istanbul ignore if */
        if (!sch.serialize)
            throw new Error("ajv implementation error");
        return sch.serialize;
    }
    _compileParser(sch) {
        compileParser.call(this, sch, sch.schema.definitions || {});
        /* istanbul ignore if */
        if (!sch.parse)
            throw new Error("ajv implementation error");
        return sch.parse;
    }
}
module.exports = exports = Ajv;
module.exports.Ajv = Ajv;
Object.defineProperty(exports, "__esModule", { value: true });
export default Ajv;
export { Format, FormatDefinition, AsyncFormatDefinition, KeywordDefinition, KeywordErrorDefinition, CodeKeywordDefinition, MacroKeywordDefinition, FuncKeywordDefinition, Vocabulary, Schema, SchemaObject, AnySchemaObject, AsyncSchema, AnySchema, ValidateFunction, AsyncValidateFunction, ErrorObject, ErrorNoParams, JTDParser, } from "./types";
export { SchemaCxt, SchemaObjCxt } from "./compile";
export { KeywordCxt } from "./compile/validate";
export { JTDErrorObject } from "./vocabularies/jtd";
export { _, str, stringify, nil, Name, Code, CodeGen, CodeGenOptions } from "./compile/codegen";
export { default as ValidationError } from "./runtime/validation_error";
export { default as MissingRefError } from "./compile/ref_error";
