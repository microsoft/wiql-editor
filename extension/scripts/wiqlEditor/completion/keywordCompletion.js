import * as Symbols from "../compiler/symbols";
import { wiqlPatterns } from "../compiler/tokenPatterns";
import { getFieldComparisonLookup } from "../errorCheckers/TypeErrorChecker";
import { conditionSymbols } from "./completionContext";
import { isInVariable } from "./isIn";
function getSymbolCompletionMap(refName, type, fields, isFieldAllowed) {
    refName = refName.toLocaleLowerCase();
    /** These symbols have their own completion logic */
    var excludedSymbols = [Symbols.Variable, Symbols.Field];
    if (!isFieldAllowed) {
        excludedSymbols.push(Symbols.LSqBracket);
    }
    var symbolCompletionMap = {};
    var fieldLookup = getFieldComparisonLookup(fields);
    for (var _i = 0, wiqlPatterns_1 = wiqlPatterns; _i < wiqlPatterns_1.length; _i++) {
        var pattern = wiqlPatterns_1[_i];
        if (typeof pattern.match === "string" &&
            pattern.token &&
            excludedSymbols.indexOf(pattern.token) < 0 &&
            (!pattern.valueTypes || type === null || pattern.valueTypes.indexOf(type) >= 0) &&
            (conditionSymbols.indexOf(pattern.token) < 0 || !refName || !(refName in fieldLookup) ||
                (fieldLookup[refName].field.indexOf(pattern.token) >= 0 ||
                    fieldLookup[refName].literal.indexOf(pattern.token) >= 0 ||
                    fieldLookup[refName].group.indexOf(pattern.token) >= 0))) {
            var symName = Symbols.getSymbolName(pattern.token);
            symbolCompletionMap[symName] = {
                label: pattern.match,
                kind: monaco.languages.CompletionItemKind.Keyword,
            };
        }
    }
    return symbolCompletionMap;
}
function isBlockedVarToken(varCtx, token) {
    if (!varCtx) {
        return false;
    }
    var offsetVars = {
        "@currentiteration": true,
        "@today": true,
    };
    var parameterVars = {
        "@currentiteration": true,
        "@teamareas": true,
    };
    var offsetTokens = {
        Minus: true,
        Plus: true,
    };
    var name = varCtx.name.toLocaleLowerCase();
    return !offsetVars[name] && offsetTokens[token] || !parameterVars[name] && token === "LParen";
}
export function getKeywordCompletions(ctx) {
    // if right after identifier it will not have been reduced to a field yet.
    var field = ctx.prevToken instanceof Symbols.Identifier ? ctx.fields.getField(ctx.prevToken.text) : null;
    var refName = ctx.fieldRefName || (field ? field.referenceName : "");
    var symbolCompletionMap = getSymbolCompletionMap(refName, ctx.isInCondition ? ctx.fieldType : null, ctx.fields, ctx.isFieldAllowed);
    var lastVar = isInVariable(ctx);
    var completions = [];
    for (var _i = 0, _a = ctx.parseNext.expectedTokens; _i < _a.length; _i++) {
        var token = _a[_i];
        if (!isBlockedVarToken(lastVar, token) &&
            symbolCompletionMap[token]) {
            // TODO filter by value type symbols by type
            completions.push(symbolCompletionMap[token]);
        }
    }
    return completions;
}
//# sourceMappingURL=keywordCompletion.js.map