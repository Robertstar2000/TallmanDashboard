var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
const Breadcrumb = React.forwardRef((_a, ref) => {
    var props = __rest(_a, []);
    return <nav ref={ref} aria-label="breadcrumb" {...props}/>;
});
Breadcrumb.displayName = 'Breadcrumb';
const BreadcrumbList = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<ol ref={ref} className={cn('flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5', className)} {...props}/>);
});
BreadcrumbList.displayName = 'BreadcrumbList';
const BreadcrumbItem = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props}/>);
});
BreadcrumbItem.displayName = 'BreadcrumbItem';
const BreadcrumbLink = React.forwardRef((_a, ref) => {
    var { asChild, className } = _a, props = __rest(_a, ["asChild", "className"]);
    const Comp = asChild ? Slot : 'a';
    return (<Comp ref={ref} className={cn('transition-colors hover:text-foreground', className)} {...props}/>);
});
BreadcrumbLink.displayName = 'BreadcrumbLink';
const BreadcrumbPage = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<span ref={ref} role="link" aria-disabled="true" aria-current="page" className={cn('font-normal text-foreground', className)} {...props}/>);
});
BreadcrumbPage.displayName = 'BreadcrumbPage';
const BreadcrumbSeparator = (_a) => {
    var { children, className } = _a, props = __rest(_a, ["children", "className"]);
    return (<li role="presentation" aria-hidden="true" className={cn('[&>svg]:size-3.5', className)} {...props}>
    {children !== null && children !== void 0 ? children : <ChevronRight />}
  </li>);
};
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';
const BreadcrumbEllipsis = (_a) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<span role="presentation" aria-hidden="true" className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <MoreHorizontal className="h-4 w-4"/>
    <span className="sr-only">More</span>
  </span>);
};
BreadcrumbEllipsis.displayName = 'BreadcrumbElipssis';
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, };
