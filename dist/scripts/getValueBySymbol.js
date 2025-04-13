/**
 * Returns the value behind the symbol with the given name.
 */
export function getValueBySymbol(symbolName, source) {
    const ownSymbols = Object.getOwnPropertySymbols(source);
    const symbol = ownSymbols.find((symbol) => {
        return symbol.description === symbolName;
    });
    if (symbol) {
        return Reflect.get(source, symbol);
    }
    return;
}
