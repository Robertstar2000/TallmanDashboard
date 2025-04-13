import { getHandler } from 'https://ipx-edge-function-layer.netlify.app/mod.ts';
import imageconfig from './imageconfig.json' assert { type: 'json' };
export default getHandler({ formats: imageconfig === null || imageconfig === void 0 ? void 0 : imageconfig.formats });
