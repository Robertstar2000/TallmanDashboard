export function isNodeLikeError(error) {
    if (error == null) {
        return false;
    }
    if (!(error instanceof Error)) {
        return false;
    }
    return 'code' in error && 'errno' in error;
}
