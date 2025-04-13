const noop = () => { };
// Ensure that routes with and without a trailing slash map to different ODB paths
const rscifyPath = (route) => {
    if (route.endsWith('/')) {
        return route.slice(0, -1) + '.rsc/';
    }
    return route + '.rsc';
};
export const getRscDataRouter = ({ routes: staticRoutes, dynamicRoutes }) => {
    const staticRouteSet = new Set(Object.entries(staticRoutes)
        .filter(([, { dataRoute }]) => dataRoute === null || dataRoute === void 0 ? void 0 : dataRoute.endsWith('.rsc'))
        .map(([route]) => route));
    const dynamicRouteMatcher = Object.values(dynamicRoutes)
        .filter(({ dataRoute }) => dataRoute === null || dataRoute === void 0 ? void 0 : dataRoute.endsWith('.rsc'))
        .map(({ routeRegex }) => new RegExp(routeRegex));
    const matchesDynamicRscDataRoute = (pathname) => {
        return dynamicRouteMatcher.some((matcher) => matcher.test(pathname));
    };
    const matchesStaticRscDataRoute = (pathname) => {
        const key = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        return staticRouteSet.has(key);
    };
    const matchesRscRoute = (pathname) => {
        return matchesStaticRscDataRoute(pathname) || matchesDynamicRscDataRoute(pathname);
    };
    return (request, context) => {
        const debug = request.headers.has('x-next-debug-logging');
        const log = debug ? (...args) => console.log(...args) : noop;
        const url = new URL(request.url);
        // If this is a static RSC request, rewrite to the data route
        if (request.headers.get('rsc') === '1') {
            log('Is rsc request');
            if (matchesRscRoute(url.pathname)) {
                request.headers.set('x-rsc-route', url.pathname);
                const target = rscifyPath(url.pathname);
                log('Rewriting to', target);
                return context.rewrite(target);
            }
        }
    };
};
