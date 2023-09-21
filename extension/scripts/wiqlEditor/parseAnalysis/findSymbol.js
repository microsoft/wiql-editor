var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { ParseError } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
/**
 * Recurse through each symbol as a tree and return the ones of type
 * @param type returned symbols should be an instanceof
 */
export function symbolsOfType(parseResult, type) {
    var stack = [];
    if (parseResult instanceof ParseError) {
        stack.push.apply(stack, parseResult.parsedTokens);
    }
    else {
        stack.push(parseResult);
    }
    var matchingSymbols = [];
    while (stack.length) {
        var symbol = stack.pop();
        if (symbol instanceof type) {
            matchingSymbols.push(symbol);
        }
        if (symbol instanceof Symbols.SymbolTree) {
            stack.push.apply(stack, symbol.inputs);
        }
    }
    return matchingSymbols;
}
export function symbolsAtPosition(line, column, parseResult) {
    if (parseResult instanceof ParseError) {
        for (var _i = 0, _a = parseResult.parsedTokens; _i < _a.length; _i++) {
            var symbol = _a[_i];
            var match = symbolsAtPositionImpl(line, column, symbol);
            if (match.length > 0) {
                return match;
            }
        }
    }
    else if (parseResult instanceof Symbols.SymbolTree) {
        return symbolsAtPositionImpl(line, column, parseResult);
    }
    return [];
}
function symbolsAtPositionImpl(line, column, symbol) {
    if (symbol instanceof Symbols.Token) {
        var isMatch = symbol.line === line - 1 &&
            symbol.startColumn <= column &&
            symbol.endColumn >= column;
        if (isMatch) {
            return [symbol];
        }
    }
    else if (symbol instanceof Symbols.SymbolTree) {
        for (var _i = 0, _a = symbol.inputs; _i < _a.length; _i++) {
            var input = _a[_i];
            var match = symbolsAtPositionImpl(line, column, input);
            if (match.length > 0) {
                return __spreadArrays(match, [symbol]);
            }
        }
    }
    return [];
}
//# sourceMappingURL=findSymbol.js.map