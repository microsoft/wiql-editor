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
var LinkTypeCountChecker = /** @class */ (function () {
    function LinkTypeCountChecker() {
    }
    LinkTypeCountChecker.prototype.check = function (parseResult) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, linkConditions, symbols, _i, _a, linkCondition, _b, linkConditions_1, linkCondition;
            return __generator(this, function (_c) {
                errors = [];
                if (parseResult instanceof Symbols.RecursiveSelect) {
                    linkConditions = symbolsOfType(parseResult, Symbols.LinkCondition).filter(function (c) {
                        return c.field && (c.field.identifier.text.toLocaleLowerCase() === "link type" ||
                            c.field.identifier.text.toLocaleLowerCase() === "system.links.linktype");
                    });
                    if (linkConditions.length === 0) {
                        symbols = [];
                        if (parseResult.recursive) {
                            symbols.push(parseResult.recursive);
                        }
                        if (parseResult.matchingChildren) {
                            symbols.push(parseResult.matchingChildren);
                        }
                        if (symbols.length > 0) {
                            errors.push(decorationFromSym("Tree query must contain at least 1 link type", symbols));
                        }
                    }
                    else if (linkConditions.length > 1) {
                        for (_i = 0, _a = linkConditions.slice(1); _i < _a.length; _i++) {
                            linkCondition = _a[_i];
                            errors.push(decorationFromSym("Too many link types in tree query", linkCondition));
                        }
                    }
                    for (_b = 0, linkConditions_1 = linkConditions; _b < linkConditions_1.length; _b++) {
                        linkCondition = linkConditions_1[_b];
                        if (linkCondition.conditionalOperator) {
                            if (!(linkCondition.conditionalOperator instanceof Symbols.ConditionalOperator) ||
                                !(linkCondition.conditionalOperator.conditionToken instanceof Symbols.Equals)) {
                                errors.push(decorationFromSym("Only equals is valid for link type in tree queries", linkCondition.conditionalOperator));
                            }
                        }
                        else {
                            errors.push(decorationFromSym("Link type must be checked against a single value", linkCondition));
                        }
                    }
                }
                return [2 /*return*/, errors];
            });
        });
    };
    return LinkTypeCountChecker;
}());
export { LinkTypeCountChecker };
//# sourceMappingURL=LinkTypeCountChecker.js.map