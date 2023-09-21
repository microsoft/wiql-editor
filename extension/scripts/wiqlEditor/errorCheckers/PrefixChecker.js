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
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { decorationFromSym } from "./errorDecorations";
var PrefixChecker = /** @class */ (function () {
    function PrefixChecker() {
    }
    PrefixChecker.prototype.checkCondition = function (condition, errors, expectedPrefix, isTop) {
        if (condition.prefix) {
            if (expectedPrefix === "Source" && !(condition.prefix instanceof Symbols.SourcePrefix)) {
                errors.push(decorationFromSym("Expected Source prefix", condition.prefix));
            }
            else if (expectedPrefix === "Target" && !(condition.prefix instanceof Symbols.TargetPrefix)) {
                errors.push(decorationFromSym("Expected target prefix", condition.prefix));
            }
            else if (!expectedPrefix) {
                expectedPrefix = condition.prefix instanceof Symbols.SourcePrefix ? "Source" : "Target";
            }
        }
        if (condition.expression) {
            expectedPrefix = this.checkExpression(condition.expression, errors, expectedPrefix, isTop);
        }
        return expectedPrefix;
    };
    PrefixChecker.prototype.checkExpression = function (expression, errors, expectedPrefix, isTop) {
        if (expectedPrefix === void 0) { expectedPrefix = null; }
        if (isTop === void 0) { isTop = true; }
        if (expression.condition) {
            expectedPrefix = this.checkCondition(expression.condition, errors, expectedPrefix, isTop && !expression.condition);
        }
        if (expression.expression) {
            expectedPrefix = this.checkExpression(expression.expression, errors, isTop ? null : expectedPrefix, isTop);
        }
        return expectedPrefix;
    };
    PrefixChecker.prototype.check = function (parseResult) {
        return __awaiter(this, void 0, void 0, function () {
            var linksKeyword, errors, _i, _a, cond;
            return __generator(this, function (_b) {
                linksKeyword = symbolsOfType(parseResult, Symbols.WorkItemLinks);
                if (linksKeyword.length === 0) {
                    return [2 /*return*/, []];
                }
                errors = [];
                for (_i = 0, _a = symbolsOfType(parseResult, Symbols.LinkCondition); _i < _a.length; _i++) {
                    cond = _a[_i];
                    if (cond.field) {
                        if (cond.field.identifier.text.toLocaleLowerCase() === "link type") {
                            errors.push(decorationFromSym("Use reference name for link type", cond.field));
                        }
                        else if (cond.field.identifier.text.toLocaleLowerCase() === "system.links.linktype") {
                            if (cond.prefix) {
                                errors.push(decorationFromSym("Link type cannot be prefixed", cond.prefix));
                            }
                        }
                        else if (!cond.prefix) {
                            errors.push(decorationFromSym("Fields must be prefixed in link queries", cond.field));
                        }
                    }
                }
                if ((parseResult instanceof Symbols.OneHopSelect || parseResult instanceof Symbols.RecursiveSelect)
                    && parseResult.whereExp) {
                    this.checkExpression(parseResult.whereExp, errors);
                }
                return [2 /*return*/, errors];
            });
        });
    };
    return PrefixChecker;
}());
export { PrefixChecker };
//# sourceMappingURL=PrefixChecker.js.map