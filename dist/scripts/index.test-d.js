import { expectType } from 'tsd';
const clone = rfdc();
expectType(clone(5));
expectType(clone({ lorem: "ipsum" }));
const cloneHandlers = rfdc({
    constructorHandlers: [
        [RegExp, (o) => new RegExp(o)],
    ],
});
