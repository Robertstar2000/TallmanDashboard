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
import * as Either from 'fp-ts/Either';
import * as Option from 'fp-ts/Option';
import * as ReadonlyArray from 'fp-ts/ReadonlyArray';
import * as ReadonlyRecord from 'fp-ts/ReadonlyRecord';
import * as SemiGroup from 'fp-ts/Semigroup';
import { absurd, flow, identity, not, pipe } from 'fp-ts/function';
import { ExactType, IntersectionType, RefinementType, TaggedUnionType, UnionType, } from 'io-ts';
import arrayToPath from './arrayToPath';
const INSTANCE_TYPES_TO_FILTER = [
    TaggedUnionType,
    UnionType,
    IntersectionType,
    ExactType,
    RefinementType,
];
const formatErrorPath = (context) => pipe(context, ReadonlyArray.filterMapWithIndex((index, contextEntry) => {
    const previousIndex = index - 1;
    const previousContextEntry = previousIndex === -1 ? undefined : context[previousIndex];
    const shouldBeFiltered = previousContextEntry === undefined ||
        INSTANCE_TYPES_TO_FILTER.some((type) => previousContextEntry.type instanceof type);
    return shouldBeFiltered ? Option.none : Option.some(contextEntry);
}), ReadonlyArray.map(({ key }) => key), ReadonlyArray.map((key) => pipe(key, (k) => parseInt(k, 10), Either.fromPredicate(not(Number.isNaN), () => key))), ReadonlyArray.toArray, arrayToPath);
const formatError = (e) => {
    const path = formatErrorPath(e.context);
    const message = pipe(e.message, Either.fromNullable(e.context), Either.mapLeft(flow(ReadonlyArray.last, Option.map((contextEntry) => `expected ${contextEntry.type.name} but got ${JSON.stringify(contextEntry.actual)}`), Option.getOrElseW(() => absurd('Error context is missing name')))), Either.getOrElseW(identity));
    const type = pipe(e.context, ReadonlyArray.last, Option.map((contextEntry) => contextEntry.type.name), Option.getOrElse(() => 'unknown'));
    return { message, type, path };
};
// this is almost the same function like Semigroup.getObjectSemigroup but reversed
// in order to get the first error
const getObjectSemigroup = () => ({
    concat: (first, second) => Object.assign({}, second, first),
});
const concatToSingleError = (errors) => pipe(errors, ReadonlyArray.map((error) => ({
    [error.path]: {
        type: error.type,
        message: error.message,
    },
})), (errors) => SemiGroup.fold(getObjectSemigroup())({}, errors));
const appendSeveralErrors = {
    concat: (a, b) => (Object.assign(Object.assign({}, b), { types: Object.assign(Object.assign({}, a.types), { [a.type]: a.message, [b.type]: b.message }) })),
};
const concatToMultipleErrors = (errors) => pipe(ReadonlyRecord.fromFoldableMap(appendSeveralErrors, ReadonlyArray.Foldable)(errors, (error) => [error.path, error]), ReadonlyRecord.map((errorWithPath) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path } = errorWithPath, error = __rest(errorWithPath, ["path"]);
    return error;
}));
const errorsToRecord = (validateAllFieldCriteria) => (validationErrors) => {
    const concat = validateAllFieldCriteria
        ? concatToMultipleErrors
        : concatToSingleError;
    return pipe(validationErrors, ReadonlyArray.map(formatError), concat);
};
export default errorsToRecord;
