import { jtdForms } from "./types";
import { SchemaEnv, getCompilingSchema } from "..";
import { _, str, and, or, nil, not, CodeGen } from "../codegen";
import MissingRefError from "../ref_error";
import N from "../names";
import { hasPropFunc } from "../../vocabularies/code";
import { hasRef } from "../../vocabularies/jtd/ref";
import { intRange } from "../../vocabularies/jtd/type";
import { parseJson, parseJsonNumber, parseJsonString } from "../../runtime/parseJson";
import { useFunc } from "../util";
import validTimestamp from "../../runtime/timestamp";
const genParse = {
    elements: parseElements,
    values: parseValues,
    discriminator: parseDiscriminator,
    properties: parseProperties,
    optionalProperties: parseProperties,
    enum: parseEnum,
    type: parseType,
    ref: parseRef,
};
export default function compileParser(sch, definitions) {
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
        return _sch;
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new CodeGen(this.scope, { es5, lines, ownProperties });
    const parseName = gen.scopeName("parse");
    const cxt = {
        self: this,
        gen,
        schema: sch.schema,
        schemaEnv: sch,
        definitions,
        data: N.data,
        parseName,
        char: gen.name("c"),
    };
    let sourceCode;
    try {
        this._compilations.add(sch);
        sch.parseName = parseName;
        parserFunction(cxt);
        gen.optimize(this.opts.code.optimize);
        const parseFuncCode = gen.toString();
        sourceCode = `${gen.scopeRefs(N.scope)}return ${parseFuncCode}`;
        const makeParse = new Function(`${N.scope}`, sourceCode);
        const parse = makeParse(this.scope.get());
        this.scope.value(parseName, { ref: parse });
        sch.parse = parse;
    }
    catch (e) {
        if (sourceCode)
            this.logger.error("Error compiling parser, function code:", sourceCode);
        delete sch.parse;
        delete sch.parseName;
        throw e;
    }
    finally {
        this._compilations.delete(sch);
    }
    return sch;
}
const undef = _ `undefined`;
function parserFunction(cxt) {
    const { gen, parseName, char } = cxt;
    gen.func(parseName, _ `${N.json}, ${N.jsonPos}, ${N.jsonPart}`, false, () => {
        gen.let(N.data);
        gen.let(char);
        gen.assign(_ `${parseName}.message`, undef);
        gen.assign(_ `${parseName}.position`, undef);
        gen.assign(N.jsonPos, _ `${N.jsonPos} || 0`);
        gen.const(N.jsonLen, _ `${N.json}.length`);
        parseCode(cxt);
        skipWhitespace(cxt);
        gen.if(N.jsonPart, () => {
            gen.assign(_ `${parseName}.position`, N.jsonPos);
            gen.return(N.data);
        });
        gen.if(_ `${N.jsonPos} === ${N.jsonLen}`, () => gen.return(N.data));
        jsonSyntaxError(cxt);
    });
}
function parseCode(cxt) {
    let form;
    for (const key of jtdForms) {
        if (key in cxt.schema) {
            form = key;
            break;
        }
    }
    if (form)
        parseNullable(cxt, genParse[form]);
    else
        parseEmpty(cxt);
}
const parseBoolean = parseBooleanToken(true, parseBooleanToken(false, jsonSyntaxError));
function parseNullable(cxt, parseForm) {
    const { gen, schema, data } = cxt;
    if (!schema.nullable)
        return parseForm(cxt);
    tryParseToken(cxt, "null", parseForm, () => gen.assign(data, null));
}
function parseElements(cxt) {
    const { gen, schema, data } = cxt;
    parseToken(cxt, "[");
    const ix = gen.let("i", 0);
    gen.assign(data, _ `[]`);
    parseItems(cxt, "]", () => {
        const el = gen.let("el");
        parseCode(Object.assign(Object.assign({}, cxt), { schema: schema.elements, data: el }));
        gen.assign(_ `${data}[${ix}++]`, el);
    });
}
function parseValues(cxt) {
    const { gen, schema, data } = cxt;
    parseToken(cxt, "{");
    gen.assign(data, _ `{}`);
    parseItems(cxt, "}", () => parseKeyValue(cxt, schema.values));
}
function parseItems(cxt, endToken, block) {
    tryParseItems(cxt, endToken, block);
    parseToken(cxt, endToken);
}
function tryParseItems(cxt, endToken, block) {
    const { gen } = cxt;
    gen.for(_ `;${N.jsonPos}<${N.jsonLen} && ${jsonSlice(1)}!==${endToken};`, () => {
        block();
        tryParseToken(cxt, ",", () => gen.break(), hasItem);
    });
    function hasItem() {
        tryParseToken(cxt, endToken, () => { }, jsonSyntaxError);
    }
}
function parseKeyValue(cxt, schema) {
    const { gen } = cxt;
    const key = gen.let("key");
    parseString(Object.assign(Object.assign({}, cxt), { data: key }));
    parseToken(cxt, ":");
    parsePropertyValue(cxt, key, schema);
}
function parseDiscriminator(cxt) {
    const { gen, data, schema } = cxt;
    const { discriminator, mapping } = schema;
    parseToken(cxt, "{");
    gen.assign(data, _ `{}`);
    const startPos = gen.const("pos", N.jsonPos);
    const value = gen.let("value");
    const tag = gen.let("tag");
    tryParseItems(cxt, "}", () => {
        const key = gen.let("key");
        parseString(Object.assign(Object.assign({}, cxt), { data: key }));
        parseToken(cxt, ":");
        gen.if(_ `${key} === ${discriminator}`, () => {
            parseString(Object.assign(Object.assign({}, cxt), { data: tag }));
            gen.assign(_ `${data}[${key}]`, tag);
            gen.break();
        }, () => parseEmpty(Object.assign(Object.assign({}, cxt), { data: value })) // can be discarded/skipped
        );
    });
    gen.assign(N.jsonPos, startPos);
    gen.if(_ `${tag} === undefined`);
    parsingError(cxt, str `discriminator tag not found`);
    for (const tagValue in mapping) {
        gen.elseIf(_ `${tag} === ${tagValue}`);
        parseSchemaProperties(Object.assign(Object.assign({}, cxt), { schema: mapping[tagValue] }), discriminator);
    }
    gen.else();
    parsingError(cxt, str `discriminator value not in schema`);
    gen.endIf();
}
function parseProperties(cxt) {
    const { gen, data } = cxt;
    parseToken(cxt, "{");
    gen.assign(data, _ `{}`);
    parseSchemaProperties(cxt);
}
function parseSchemaProperties(cxt, discriminator) {
    const { gen, schema, data } = cxt;
    const { properties, optionalProperties, additionalProperties } = schema;
    parseItems(cxt, "}", () => {
        const key = gen.let("key");
        parseString(Object.assign(Object.assign({}, cxt), { data: key }));
        parseToken(cxt, ":");
        gen.if(false);
        parseDefinedProperty(cxt, key, properties);
        parseDefinedProperty(cxt, key, optionalProperties);
        if (discriminator) {
            gen.elseIf(_ `${key} === ${discriminator}`);
            const tag = gen.let("tag");
            parseString(Object.assign(Object.assign({}, cxt), { data: tag })); // can be discarded, it is already assigned
        }
        gen.else();
        if (additionalProperties) {
            parseEmpty(Object.assign(Object.assign({}, cxt), { data: _ `${data}[${key}]` }));
        }
        else {
            parsingError(cxt, str `property ${key} not allowed`);
        }
        gen.endIf();
    });
    if (properties) {
        const hasProp = hasPropFunc(gen);
        const allProps = and(...Object.keys(properties).map((p) => _ `${hasProp}.call(${data}, ${p})`));
        gen.if(not(allProps), () => parsingError(cxt, str `missing required properties`));
    }
}
function parseDefinedProperty(cxt, key, schemas = {}) {
    const { gen } = cxt;
    for (const prop in schemas) {
        gen.elseIf(_ `${key} === ${prop}`);
        parsePropertyValue(cxt, key, schemas[prop]);
    }
}
function parsePropertyValue(cxt, key, schema) {
    parseCode(Object.assign(Object.assign({}, cxt), { schema, data: _ `${cxt.data}[${key}]` }));
}
function parseType(cxt) {
    const { gen, schema, data, self } = cxt;
    switch (schema.type) {
        case "boolean":
            parseBoolean(cxt);
            break;
        case "string":
            parseString(cxt);
            break;
        case "timestamp": {
            parseString(cxt);
            const vts = useFunc(gen, validTimestamp);
            const { allowDate, parseDate } = self.opts;
            const notValid = allowDate ? _ `!${vts}(${data}, true)` : _ `!${vts}(${data})`;
            const fail = parseDate
                ? or(notValid, _ `(${data} = new Date(${data}), false)`, _ `isNaN(${data}.valueOf())`)
                : notValid;
            gen.if(fail, () => parsingError(cxt, str `invalid timestamp`));
            break;
        }
        case "float32":
        case "float64":
            parseNumber(cxt);
            break;
        default: {
            const t = schema.type;
            if (!self.opts.int32range && (t === "int32" || t === "uint32")) {
                parseNumber(cxt, 16); // 2 ** 53 - max safe integer
                if (t === "uint32") {
                    gen.if(_ `${data} < 0`, () => parsingError(cxt, str `integer out of range`));
                }
            }
            else {
                const [min, max, maxDigits] = intRange[t];
                parseNumber(cxt, maxDigits);
                gen.if(_ `${data} < ${min} || ${data} > ${max}`, () => parsingError(cxt, str `integer out of range`));
            }
        }
    }
}
function parseString(cxt) {
    parseToken(cxt, '"');
    parseWith(cxt, parseJsonString);
}
function parseEnum(cxt) {
    const { gen, data, schema } = cxt;
    const enumSch = schema.enum;
    parseToken(cxt, '"');
    // TODO loopEnum
    gen.if(false);
    for (const value of enumSch) {
        const valueStr = JSON.stringify(value).slice(1); // remove starting quote
        gen.elseIf(_ `${jsonSlice(valueStr.length)} === ${valueStr}`);
        gen.assign(data, str `${value}`);
        gen.add(N.jsonPos, valueStr.length);
    }
    gen.else();
    jsonSyntaxError(cxt);
    gen.endIf();
}
function parseNumber(cxt, maxDigits) {
    const { gen } = cxt;
    skipWhitespace(cxt);
    gen.if(_ `"-0123456789".indexOf(${jsonSlice(1)}) < 0`, () => jsonSyntaxError(cxt), () => parseWith(cxt, parseJsonNumber, maxDigits));
}
function parseBooleanToken(bool, fail) {
    return (cxt) => {
        const { gen, data } = cxt;
        tryParseToken(cxt, `${bool}`, () => fail(cxt), () => gen.assign(data, bool));
    };
}
function parseRef(cxt) {
    const { gen, self, definitions, schema, schemaEnv } = cxt;
    const { ref } = schema;
    const refSchema = definitions[ref];
    if (!refSchema)
        throw new MissingRefError(self.opts.uriResolver, "", ref, `No definition ${ref}`);
    if (!hasRef(refSchema))
        return parseCode(Object.assign(Object.assign({}, cxt), { schema: refSchema }));
    const { root } = schemaEnv;
    const sch = compileParser.call(self, new SchemaEnv({ schema: refSchema, root }), definitions);
    partialParse(cxt, getParser(gen, sch), true);
}
function getParser(gen, sch) {
    return sch.parse
        ? gen.scopeValue("parse", { ref: sch.parse })
        : _ `${gen.scopeValue("wrapper", { ref: sch })}.parse`;
}
function parseEmpty(cxt) {
    parseWith(cxt, parseJson);
}
function parseWith(cxt, parseFunc, args) {
    partialParse(cxt, useFunc(cxt.gen, parseFunc), args);
}
function partialParse(cxt, parseFunc, args) {
    const { gen, data } = cxt;
    gen.assign(data, _ `${parseFunc}(${N.json}, ${N.jsonPos}${args ? _ `, ${args}` : nil})`);
    gen.assign(N.jsonPos, _ `${parseFunc}.position`);
    gen.if(_ `${data} === undefined`, () => parsingError(cxt, _ `${parseFunc}.message`));
}
function parseToken(cxt, tok) {
    tryParseToken(cxt, tok, jsonSyntaxError);
}
function tryParseToken(cxt, tok, fail, success) {
    const { gen } = cxt;
    const n = tok.length;
    skipWhitespace(cxt);
    gen.if(_ `${jsonSlice(n)} === ${tok}`, () => {
        gen.add(N.jsonPos, n);
        success === null || success === void 0 ? void 0 : success(cxt);
    }, () => fail(cxt));
}
function skipWhitespace({ gen, char: c }) {
    gen.code(_ `while((${c}=${N.json}[${N.jsonPos}],${c}===" "||${c}==="\\n"||${c}==="\\r"||${c}==="\\t"))${N.jsonPos}++;`);
}
function jsonSlice(len) {
    return len === 1
        ? _ `${N.json}[${N.jsonPos}]`
        : _ `${N.json}.slice(${N.jsonPos}, ${N.jsonPos}+${len})`;
}
function jsonSyntaxError(cxt) {
    parsingError(cxt, _ `"unexpected token " + ${N.json}[${N.jsonPos}]`);
}
function parsingError({ gen, parseName }, msg) {
    gen.assign(_ `${parseName}.message`, msg);
    gen.assign(_ `${parseName}.position`, N.jsonPos);
    gen.return(undef);
}
