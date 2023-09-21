import * as Symbols from "../compiler/symbols";
export function getStandardFieldCompletions(fields, type) {
    var matchingFields = fields.values.filter(function (f) { return type === null || type === f.type; });
    return matchingFields.map(function (f) {
        return {
            label: f.referenceName,
            kind: monaco.languages.CompletionItemKind.Variable,
        };
    }).concat(matchingFields.map(function (f) {
        return {
            label: f.name,
            kind: monaco.languages.CompletionItemKind.Variable,
        };
    }));
}
export function getFieldCompletions(ctx) {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0 && ctx.isFieldAllowed) {
        var fieldCompletions = getStandardFieldCompletions(ctx.fields, ctx.isInCondition ? ctx.fieldType : null);
        if (!(ctx.prevToken instanceof Symbols.LSqBracket)) {
            fieldCompletions = fieldCompletions.filter(function (s) { return s.label.indexOf(" ") < 0; });
        }
        return fieldCompletions;
    }
    return [];
}
//# sourceMappingURL=fieldCompletion.js.map