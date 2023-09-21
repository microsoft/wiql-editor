import { parse, ParseMode } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { getFieldComparisonLookup } from "../errorCheckers/TypeErrorChecker";
export var conditionSymbols = [
    Symbols.Equals,
    Symbols.NotEquals,
    Symbols.LessThan,
    Symbols.LessOrEq,
    Symbols.GreaterThan,
    Symbols.GreaterOrEq,
    Symbols.Like,
    Symbols.Under,
    Symbols.Contains,
    Symbols.Ever,
    Symbols.In,
    Symbols.IsEmpty,
    Symbols.IsNotEmpty,
];
/**
 * Whether the given parseState is parsing a conditional token.
 * Ideally the compilier would be able to tell us which productions it was currently parsing - this is just a workaround.
 * @param symbol
 */
function isInConditionParse(parseNext) {
    for (var _i = 0, _a = parseNext.parsedTokens; _i < _a.length; _i++) {
        var symbol = _a[_i];
        for (var _b = 0, conditionSymbols_1 = conditionSymbols; _b < conditionSymbols_1.length; _b++) {
            var conditionSym = conditionSymbols_1[_b];
            if (symbol instanceof conditionSym) {
                return true;
            }
        }
    }
    return false;
}
function getFieldSymbolRefName(parseNext) {
    for (var _i = 0, _a = parseNext.parsedTokens; _i < _a.length; _i++) {
        var symbol = _a[_i];
        if (symbol instanceof Symbols.Field) {
            return symbol.identifier.text.toLocaleLowerCase();
        }
    }
    return "";
}
export function createContext(model, parseNext, fields) {
    var parsedCount = parseNext.parsedTokens.length;
    var prevToken = parseNext.parsedTokens[parsedCount - 1];
    var prevToken2 = parseNext.parsedTokens[parsedCount - 2];
    var fieldRefName = getFieldSymbolRefName(parseNext);
    var fieldInstance = fields.getField(fieldRefName) || null;
    var fieldType = fieldInstance && fieldInstance.type;
    var isInCondition = isInConditionParse(parseNext);
    var isFieldAllowed = !fieldInstance ||
        !isInCondition ||
        (getFieldComparisonLookup(fields)[fieldRefName].field.length > 0 &&
            !(prevToken instanceof Symbols.Group));
    var assumedParse = null;
    function getAssumedParse() {
        if (!assumedParse) {
            assumedParse = parse(model.getLinesContent(), ParseMode.AssumeString);
        }
        return assumedParse;
    }
    return {
        parseNext: parseNext,
        fields: fields,
        parsedTokens: parseNext.parsedTokens,
        prevToken2: prevToken2,
        prevToken: prevToken,
        fieldRefName: fieldRefName,
        fieldType: fieldType,
        isInCondition: isInCondition,
        isFieldAllowed: isFieldAllowed,
        getAssumedParse: getAssumedParse,
    };
}
//# sourceMappingURL=completionContext.js.map