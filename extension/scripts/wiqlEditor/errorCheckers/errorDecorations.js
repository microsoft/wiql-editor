import * as Symbols from "../compiler/symbols";
export function rangeFromSymbol(symbol) {
    var startToken = null;
    var endToken = null;
    var symbols = symbol instanceof Array ? symbol : [symbol];
    while (symbols.length > 0) {
        var sym = symbols.pop();
        if (sym instanceof Symbols.Token) {
            if (!startToken || sym.line < startToken.line || sym.startColumn < startToken.startColumn) {
                startToken = sym;
            }
            if (!endToken || sym.line > endToken.line || sym.endColumn > endToken.endColumn) {
                endToken = sym;
            }
        }
        else if (sym instanceof Symbols.SymbolTree) {
            symbols.push.apply(symbols, sym.inputs);
        }
    }
    if (!startToken || !endToken) {
        throw new Error("Could not find token in symbol " + JSON.stringify(symbol));
    }
    return new monaco.Range(startToken.line + 1, startToken.startColumn + 1, endToken.line + 1, endToken.endColumn + 1);
}
function decorationFromRange(hoverMessage, range, type) {
    return {
        range: range,
        options: {
            hoverMessage: hoverMessage,
            className: "underline wiql-" + type,
            linesDecorationsClassName: "column-color wiql-" + type,
        },
    };
}
export function decorationFromString(message, str, offset, length, type) {
    if (type === void 0) { type = "error"; }
    return decorationFromRange(message, new monaco.Range(str.line + 1, str.startColumn + 1 + offset, str.line + 1, str.startColumn + 1 + offset + length), type);
}
export function decorationFromSym(message, symbol, type) {
    if (type === void 0) { type = "error"; }
    return decorationFromRange(message, rangeFromSymbol(symbol), type);
}
//# sourceMappingURL=errorDecorations.js.map