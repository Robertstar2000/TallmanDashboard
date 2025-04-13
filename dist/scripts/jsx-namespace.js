// this is basically a slimmed down copy of https://github.com/emotion-js/emotion/blob/main/packages/react/types/jsx-namespace.d.ts
// it helps to avoid issues when combining newer `@emotion/styled` and older `@emotion/react` versions
// in such setup, ReactJSX namespace won't exist in `@emotion/react` and that would lead to errors
import 'react';
