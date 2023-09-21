import * as Symbols from "./symbols";
import { tokenize } from "./tokenizer";
import { validIdentifier, wiqlPatterns } from "./tokenPatterns";
import { table } from "./wiqlTable";
var symbolContructors = {};
for (var idx in Symbols) {
    var symbol = Symbols[idx];
    var symbolName = Symbols.getSymbolName(symbol);
    symbolContructors[symbolName] = symbol;
}
var ParseError = /** @class */ (function () {
    function ParseError(expectedTokens, errorToken, remainingTokens, parsedTokens) {
        this.expectedTokens = expectedTokens;
        this.errorToken = errorToken;
        this.remainingTokens = remainingTokens;
        this.parsedTokens = parsedTokens;
    }
    return ParseError;
}());
export { ParseError };
export var ParseMode;
(function (ParseMode) {
    ParseMode[ParseMode["Default"] = 0] = "Default";
    ParseMode[ParseMode["Suggest"] = 1] = "Suggest";
    ParseMode[ParseMode["AssumeString"] = 2] = "AssumeString";
})(ParseMode || (ParseMode = {}));
var EOF = Symbols.getSymbolName(Symbols.EOF);
export function parse(lines, mode) {
    if (mode === void 0) { mode = ParseMode.Default; }
    var tokens = tokenize(lines, wiqlPatterns).reverse();
    tokens.unshift(new Symbols.EOF(lines.length, lines[lines.length - 1].length, tokens[0]));
    var stack = [];
    var peekToken = function () { return tokens[tokens.length - 1]; };
    var currState = function () { return stack.length ? stack[stack.length - 1].state : 0; };
    var symbolName = function (symbol) { return Symbols.getSymbolName(Object.getPrototypeOf(symbol).constructor); };
    while (true) {
        var state = currState();
        var nextToken = peekToken();
        var nextTokenName = symbolName(nextToken);
        // sometimes keywords are used as identifiers
        if (!(nextTokenName in table[state].tokens) &&
            Symbols.getSymbolName(Symbols.Identifier) in table[state].tokens &&
            validIdentifier(nextToken)) {
            tokens.pop();
            tokens.push(new Symbols.Identifier(nextToken.line, nextToken.startColumn, nextTokenName));
            nextToken = peekToken();
            nextTokenName = symbolName(nextToken);
        }
        else if (mode === ParseMode.AssumeString &&
            !(nextTokenName in table[state].tokens) &&
            Symbols.getSymbolName(Symbols.String) in table[state].tokens) {
            tokens.push(new Symbols.String(-1, -1, ""));
            nextToken = peekToken();
            nextTokenName = symbolName(nextToken);
        }
        var action = table[state].tokens[nextTokenName];
        if (action === undefined || (mode === ParseMode.Suggest && nextTokenName === EOF)) {
            var expectedTokens = Object.keys(table[state].tokens);
            return new ParseError(expectedTokens, nextToken, tokens, stack.map(function (i) { return i.symbol; }));
        }
        if (action.action === "shift") {
            stack.push({ state: action.state, symbol: tokens.pop() });
        }
        else if (action.action === "reduce") {
            var args = [];
            for (var i = 0; i < action.production.inputCount; i++) {
                args.push(stack.pop().symbol);
            }
            args.reverse();
            var sym = new symbolContructors[action.production.result](args);
            var symName = symbolName(sym);
            var nextState = table[currState()].symbols[symName];
            if (nextState === undefined) {
                throw new Error("Grammar error: unexpected symbol " + symName);
            }
            else if (nextState === -1) {
                return sym;
            }
            else {
                stack.push({ state: nextState, symbol: sym });
            }
        }
    }
}
//# sourceMappingURL=parser.js.map