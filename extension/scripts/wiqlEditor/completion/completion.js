var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { fieldsVal } from "../../cachedData/fields";
import { parse, ParseError, ParseMode } from "../compiler/parser";
import { createContext } from "./completionContext";
import { getFieldCompletions } from "./fieldCompletion";
import { getCurrentIdentifierCompletions } from "./identifierCompletion";
import { isInsideString } from "./isIn";
import { getKeywordCompletions } from "./keywordCompletion";
import { pushStringCompletions } from "./pushStringCompletions";
import { getStringValueCompletions } from "./valueCompletions";
import { getVariableParameterCompletions } from "./variableArgumentCompletion";
import { getCurrentVariableCompletions, getVariableCompletions } from "./variableCompletion";
function parseFromPosition(model, position) {
    var lines = model.getLinesContent().slice(0, position.lineNumber);
    if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
    }
    return parse(lines, ParseMode.Suggest);
}
function provideCompletionItems(model, position) {
    return __awaiter(this, void 0, void 0, function () {
        var parseNext, ctx, _a, _b, completions, _c, _d, _e, _f, values;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    parseNext = parseFromPosition(model, position);
                    if (!(parseNext instanceof ParseError) || parseNext.remainingTokens.length > 2) {
                        // valid query, can't suggest
                        return [2 /*return*/, []];
                    }
                    _a = createContext;
                    _b = [model, parseNext];
                    return [4 /*yield*/, fieldsVal.getValue()];
                case 1:
                    ctx = _a.apply(void 0, _b.concat([_g.sent()]));
                    return [4 /*yield*/, getCurrentIdentifierCompletions(ctx, position)];
                case 2:
                    _c = [_g.sent()];
                    return [4 /*yield*/, getCurrentVariableCompletions(ctx, position)];
                case 3:
                    completions = __spreadArrays.apply(void 0, _c.concat([_g.sent()]));
                    if (completions.length > 0) {
                        return [2 /*return*/, completions];
                    }
                    // Don't symbols complete inside strings
                    if (!isInsideString(ctx)) {
                        completions.push.apply(completions, __spreadArrays(getKeywordCompletions(ctx), getFieldCompletions(ctx), getVariableCompletions(ctx)));
                    }
                    if (completions.length > 0) {
                        return [2 /*return*/, completions];
                    }
                    _e = (_d = completions.push).apply;
                    _f = [completions];
                    return [4 /*yield*/, getVariableParameterCompletions(ctx)];
                case 4:
                    _e.apply(_d, _f.concat([_g.sent()]));
                    if (completions.length > 0) {
                        return [2 /*return*/, completions];
                    }
                    if (!(ctx.fieldRefName && ctx.isInCondition)) return [3 /*break*/, 6];
                    return [4 /*yield*/, getStringValueCompletions(ctx)];
                case 5:
                    values = _g.sent();
                    return [2 /*return*/, pushStringCompletions(ctx, values, completions)];
                case 6: return [2 /*return*/, completions];
            }
        });
    });
}
export var completionProvider = {
    triggerCharacters: [" ", "\t", "[", ".", "@", "\"", "'", "\\"],
    provideCompletionItems: provideCompletionItems,
};
//# sourceMappingURL=completion.js.map