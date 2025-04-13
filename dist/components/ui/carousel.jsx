'use client';
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
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
const CarouselContext = React.createContext(null);
function useCarousel() {
    const context = React.useContext(CarouselContext);
    if (!context) {
        throw new Error('useCarousel must be used within a <Carousel />');
    }
    return context;
}
const Carousel = React.forwardRef((_a, ref) => {
    var { orientation = 'horizontal', opts, setApi, plugins, className, children } = _a, props = __rest(_a, ["orientation", "opts", "setApi", "plugins", "className", "children"]);
    const [carouselRef, api] = useEmblaCarousel(Object.assign(Object.assign({}, opts), { axis: orientation === 'horizontal' ? 'x' : 'y' }), plugins);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const onSelect = React.useCallback((api) => {
        if (!api) {
            return;
        }
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
    }, []);
    const scrollPrev = React.useCallback(() => {
        api === null || api === void 0 ? void 0 : api.scrollPrev();
    }, [api]);
    const scrollNext = React.useCallback(() => {
        api === null || api === void 0 ? void 0 : api.scrollNext();
    }, [api]);
    const handleKeyDown = React.useCallback((event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            scrollPrev();
        }
        else if (event.key === 'ArrowRight') {
            event.preventDefault();
            scrollNext();
        }
    }, [scrollPrev, scrollNext]);
    React.useEffect(() => {
        if (!api || !setApi) {
            return;
        }
        setApi(api);
    }, [api, setApi]);
    React.useEffect(() => {
        if (!api) {
            return;
        }
        onSelect(api);
        api.on('reInit', onSelect);
        api.on('select', onSelect);
        return () => {
            api === null || api === void 0 ? void 0 : api.off('select', onSelect);
        };
    }, [api, onSelect]);
    return (<CarouselContext.Provider value={{
            carouselRef,
            api: api,
            opts,
            orientation: orientation || ((opts === null || opts === void 0 ? void 0 : opts.axis) === 'y' ? 'vertical' : 'horizontal'),
            scrollPrev,
            scrollNext,
            canScrollPrev,
            canScrollNext,
        }}>
        <div ref={ref} onKeyDownCapture={handleKeyDown} className={cn('relative', className)} role="region" aria-roledescription="carousel" {...props}>
          {children}
        </div>
      </CarouselContext.Provider>);
});
Carousel.displayName = 'Carousel';
const CarouselContent = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    const { carouselRef, orientation } = useCarousel();
    return (<div ref={carouselRef} className="overflow-hidden">
      <div ref={ref} className={cn('flex', orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)} {...props}/>
    </div>);
});
CarouselContent.displayName = 'CarouselContent';
const CarouselItem = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    const { orientation } = useCarousel();
    return (<div ref={ref} role="group" aria-roledescription="slide" className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'pl-4' : 'pt-4', className)} {...props}/>);
});
CarouselItem.displayName = 'CarouselItem';
const CarouselPrevious = React.forwardRef((_a, ref) => {
    var { className, variant = 'outline', size = 'icon' } = _a, props = __rest(_a, ["className", "variant", "size"]);
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();
    return (<Button ref={ref} variant={variant} size={size} className={cn('absolute  h-8 w-8 rounded-full', orientation === 'horizontal'
            ? '-left-12 top-1/2 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90', className)} disabled={!canScrollPrev} onClick={scrollPrev} {...props}>
      <ArrowLeft className="h-4 w-4"/>
      <span className="sr-only">Previous slide</span>
    </Button>);
});
CarouselPrevious.displayName = 'CarouselPrevious';
const CarouselNext = React.forwardRef((_a, ref) => {
    var { className, variant = 'outline', size = 'icon' } = _a, props = __rest(_a, ["className", "variant", "size"]);
    const { orientation, scrollNext, canScrollNext } = useCarousel();
    return (<Button ref={ref} variant={variant} size={size} className={cn('absolute h-8 w-8 rounded-full', orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90', className)} disabled={!canScrollNext} onClick={scrollNext} {...props}>
      <ArrowRight className="h-4 w-4"/>
      <span className="sr-only">Next slide</span>
    </Button>);
});
CarouselNext.displayName = 'CarouselNext';
export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, };
