import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
const arrayToPath = (paths) => paths.reduce((previous, path, index) => pipe(path, Either.fold((key) => `${index > 0 ? '.' : ''}${key}`, (key) => `[${key}]`), (path) => `${previous}${path}`), '');
export default arrayToPath;
