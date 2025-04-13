import { isPropertyAccessible } from './isPropertyAccessible';
/**
 * Creates a generic 500 Unhandled Exception response.
 */
export function createServerErrorResponse(body) {
    return new Response(JSON.stringify(body instanceof Error
        ? {
            name: body.name,
            message: body.message,
            stack: body.stack,
        }
        : body), {
        status: 500,
        statusText: 'Unhandled Exception',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
/**
 * Check if the given response is a `Response.error()`.
 *
 * @note Some environments, like Miniflare (Cloudflare) do not
 * implement the "Response.type" property and throw on its access.
 * Safely check if we can access "type" on "Response" before continuing.
 * @see https://github.com/mswjs/msw/issues/1834
 */
export function isResponseError(response) {
    return isPropertyAccessible(response, 'type') && response.type === 'error';
}
