export function isDomParserSupportedType(type) {
    const supportedTypes = [
        'application/xhtml+xml',
        'application/xml',
        'image/svg+xml',
        'text/html',
        'text/xml',
    ];
    return supportedTypes.some((supportedType) => {
        return type.startsWith(supportedType);
    });
}
