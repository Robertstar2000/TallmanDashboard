var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Available at build time
import { _DEFINITION as edgeFunctionDefinition, default as edgeFunction } from './bundle.js';
import { buildNextRequest, buildResponse, redirectTrailingSlash } from '../edge-shared/utils.ts';
import nextConfig from '../edge-shared/nextConfig.json' assert { type: 'json' };
const handler = (req, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const url = new URL(req.url);
    const redirect = redirectTrailingSlash(url, nextConfig.trailingSlash);
    if (redirect) {
        return redirect;
    }
    const request = buildNextRequest(req, context, nextConfig);
    (_a = request.headers)['x-matched-path'] || (_a['x-matched-path'] = edgeFunctionDefinition.page);
    try {
        const result = yield edgeFunction({ request });
        return buildResponse({ result, request: req, context });
    }
    catch (error) {
        console.error(error);
        return new Response(error.message, { status: 500 });
    }
});
export default handler;
