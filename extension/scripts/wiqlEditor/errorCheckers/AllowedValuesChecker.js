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
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { decorationFromSym } from "./errorDecorations";
var AllowedValuesChecker = /** @class */ (function () {
    function AllowedValuesChecker(fieldRefName, fieldName, allowedValuesVal, errorMessage) {
        this.fieldRefName = fieldRefName;
        this.fieldName = fieldName;
        this.allowedValuesVal = allowedValuesVal;
        this.errorMessage = errorMessage;
    }
    AllowedValuesChecker.prototype.check = function (parseResult) {
        return __awaiter(this, void 0, void 0, function () {
            var allConditions, fieldIds, fieldConditions, allowedValues, errors, _i, fieldConditions_1, condition, valueList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allConditions = __spreadArrays(symbolsOfType(parseResult, Symbols.ConditionalExpression), symbolsOfType(parseResult, Symbols.LinkCondition));
                        fieldIds = [this.fieldName.toLocaleLowerCase(), this.fieldRefName.toLocaleLowerCase()];
                        fieldConditions = allConditions.filter(function (c) { return c.field && fieldIds.indexOf(c.field.identifier.text.toLocaleLowerCase()) >= 0; });
                        if (fieldConditions.length === 0) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.allowedValuesVal.getValue()];
                    case 1:
                        allowedValues = _a.sent();
                        allowedValues = __spreadArrays(allowedValues.map(function (v) { return "\"" + v.toLocaleLowerCase() + "\""; }), allowedValues.map(function (v) { return "'" + v.toLocaleLowerCase() + "'"; }));
                        errors = [];
                        for (_i = 0, fieldConditions_1 = fieldConditions; _i < fieldConditions_1.length; _i++) {
                            condition = fieldConditions_1[_i];
                            if (condition.value && condition.value.value instanceof Symbols.String &&
                                allowedValues.indexOf(condition.value.value.text.toLocaleLowerCase()) < 0) {
                                errors.push(decorationFromSym(this.errorMessage || "Invalid " + this.fieldName + " value", condition.value));
                            }
                            valueList = condition.valueList;
                            while (valueList && valueList.value) {
                                if (valueList.value.value instanceof Symbols.String &&
                                    allowedValues.indexOf(valueList.value.value.text.toLocaleLowerCase()) < 0) {
                                    errors.push(decorationFromSym(this.errorMessage || "Invalid " + this.fieldName + " value", valueList.value));
                                }
                                valueList = valueList.restOfList;
                            }
                        }
                        return [2 /*return*/, errors];
                }
            });
        });
    };
    return AllowedValuesChecker;
}());
export { AllowedValuesChecker };
//# sourceMappingURL=AllowedValuesChecker.js.map