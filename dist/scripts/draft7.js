import coreVocabulary from "./core";
import validationVocabulary from "./validation";
import getApplicatorVocabulary from "./applicator";
import formatVocabulary from "./format";
import { metadataVocabulary, contentVocabulary } from "./metadata";
const draft7Vocabularies = [
    coreVocabulary,
    validationVocabulary,
    getApplicatorVocabulary(),
    formatVocabulary,
    metadataVocabulary,
    contentVocabulary,
];
export default draft7Vocabularies;
