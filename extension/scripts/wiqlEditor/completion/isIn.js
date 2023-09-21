import * as Symbols from "../compiler/symbols";
export function isInsideString(ctx) {
    return ctx.parseNext.errorToken instanceof Symbols.NonterminatingString;
}
export function isInVariable(ctx) {
    var context = null;
    for (var _i = 0, _a = ctx.parsedTokens; _i < _a.length; _i++) {
        var token = _a[_i];
        if (token instanceof Symbols.Variable) {
            context = { name: token.text };
        }
        else if (context && token instanceof Symbols.LParen) {
            context.args = [];
        }
        else if (context && context.args && !(token instanceof Symbols.Comma)) {
            context.args.push(token);
        }
    }
    return context;
}
//# sourceMappingURL=isIn.js.map