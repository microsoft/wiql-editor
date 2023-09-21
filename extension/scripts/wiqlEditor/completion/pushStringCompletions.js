import * as Symbols from "../compiler/symbols";
import { isInsideString } from "./isIn";
export function pushStringCompletions(ctx, strings, completions) {
    var inString = isInsideString(ctx);
    for (var _i = 0, strings_1 = strings; _i < strings_1.length; _i++) {
        var str = strings_1[_i];
        completions.push({
            label: inString ? str : "\"" + str + "\"",
            kind: monaco.languages.CompletionItemKind.Text,
        });
    }
    if (ctx.parseNext.errorToken instanceof Symbols.NonterminatingString) {
        var currentStr = ctx.parseNext.errorToken.text.substr(1);
        var charIdx_1 = -1;
        for (var _a = 0, _b = ". \\-:<>"; _a < _b.length; _a++) {
            var char = _b[_a];
            charIdx_1 = Math.max(charIdx_1, currentStr.lastIndexOf(char));
        }
        if (charIdx_1 >= 0) {
            var prefix_1 = currentStr.substr(0, charIdx_1).toLocaleLowerCase();
            return completions.filter(function (s) { return s.label.toLocaleLowerCase().indexOf(prefix_1) === 0; }).map(function (s) {
                return ({
                    label: s.label,
                    kind: monaco.languages.CompletionItemKind.Text,
                    insertText: s.label.substr(charIdx_1 + 1),
                });
            });
        }
    }
    return completions;
}
//# sourceMappingURL=pushStringCompletions.js.map