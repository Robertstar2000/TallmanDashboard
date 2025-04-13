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
import matchers from './matchers.json' assert { type: 'json' };
import edgeFunction from './bundle.js';
import { buildNextRequest, buildResponse } from '../edge-shared/utils.ts';
import { getMiddlewareRouteMatcher, searchParamsToUrlQuery } from '../edge-shared/next-utils.ts';
import nextConfig from '../edge-shared/nextConfig.json' assert { type: 'json' };
const matchesMiddleware = getMiddlewareRouteMatcher(matchers || []);
globalThis.NFRequestContextMap || (globalThis.NFRequestContextMap = new Map());
const handler = (req, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (Deno.env.get('NETLIFY_DEV')) {
        // Don't run in dev
        return;
    }
    const url = new URL(req.url);
    // While we have already checked the path when mapping to the edge function,
    // Next.js supports extra rules that we need to check here too.
    if (!matchesMiddleware(url.pathname, req, searchParamsToUrlQuery(url.searchParams))) {
        return;
    }
    const requestId = req.headers.get('x-nf-request-id');
    if (!requestId) {
        console.error('Missing x-nf-request-id header');
    }
    else {
        globalThis.NFRequestContextMap.set(requestId, {
            request: req,
            context,
        });
    }
    const request = buildNextRequest(req, context, nextConfig);
    try {
        const result = yield edgeFunction({ request });
        return buildResponse({ result, request: req, context });
    }
    catch (error) {
        console.error(error);
        return new Response(error.message, { status: 500 });
    }
    finally {
        if (requestId) {
            globalThis.NFRequestContextMap.delete(requestId);
        }
    }
});
export default handler;
