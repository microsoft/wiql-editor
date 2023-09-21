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
import { FieldType } from "TFS/WorkItemTracking/Contracts";
import { CachedValue } from "../../cachedData/CachedValue";
import { fieldsVal } from "../../cachedData/fields";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { lowerDefinedVariables } from "../wiqlDefinition";
import { decorationFromSym } from "./errorDecorations";
var compTypes = {};
/** Map of field type to the valid comparisons for it, this works for most fields.
 * For use specifically by getFieldComparisonLookup
 */
function addCompTypes(types, literal, group, field) {
    for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
        var fieldType = types_1[_i];
        compTypes[fieldType] = {
            fieldType: fieldType,
            field: field,
            group: group,
            literal: literal,
        };
    }
}
addCompTypes([FieldType.History], [Symbols.Contains, Symbols.ContainsWords], [], []);
addCompTypes([FieldType.Html, FieldType.PlainText], [Symbols.Contains, Symbols.ContainsWords, Symbols.IsEmpty, Symbols.IsNotEmpty], [], []);
addCompTypes([FieldType.Double, FieldType.Integer, FieldType.DateTime, FieldType.Guid], [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq, Symbols.Ever], [Symbols.In], [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq]);
addCompTypes([FieldType.String], [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq, Symbols.Ever, Symbols.Contains, Symbols.InGroup], [Symbols.In], [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq]);
addCompTypes([FieldType.Boolean], [Symbols.Equals, Symbols.NotEquals, Symbols.Ever], [], [Symbols.Equals, Symbols.NotEquals]);
addCompTypes([FieldType.TreePath], [Symbols.Equals, Symbols.NotEquals, Symbols.Under], [Symbols.In], []);
var comparisonLookupCache = {};
export function getFieldComparisonLookup(fields) {
    if (!(fields.lookupId in comparisonLookupCache)) {
        var fieldLookup = {};
        for (var _i = 0, _a = fields.values; _i < _a.length; _i++) {
            var field = _a[_i];
            if ("System.Links.LinkType" === field.referenceName) {
                fieldLookup[field.name.toLocaleLowerCase()] = fieldLookup[field.referenceName.toLocaleLowerCase()] = {
                    fieldType: FieldType.String,
                    group: [],
                    literal: [Symbols.Equals, Symbols.NotEquals],
                    field: [],
                };
            }
            else {
                fieldLookup[field.name.toLocaleLowerCase()] = fieldLookup[field.referenceName.toLocaleLowerCase()] = compTypes[field.type];
            }
        }
        comparisonLookupCache[fields.lookupId] = fieldLookup;
    }
    return comparisonLookupCache[fields.lookupId];
}
var TypeErrorChecker = /** @class */ (function () {
    function TypeErrorChecker() {
        var _this = this;
        this.fieldLookup = new CachedValue(function () { return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = getFieldComparisonLookup;
                    return [4 /*yield*/, fieldsVal.getValue()];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
            }
        }); }); });
    }
    TypeErrorChecker.prototype.checkComparisonOperator = function (fieldLookup, comp, field, rhsType) {
        var operatorToken = comp instanceof Symbols.ConditionalOperator ? comp.conditionToken : comp;
        var validOps = fieldLookup[field.identifier.text.toLocaleLowerCase()][rhsType];
        if (validOps.length === 0) {
            return [decorationFromSym("There is no valid operation for " + field.identifier.text + " and " + rhsType, operatorToken)];
        }
        if (validOps.filter(function (op) { return operatorToken instanceof op; }).length === 0) {
            var message = "Valid comparisons are " + validOps.map(function (op) { return Symbols.getSymbolName(op); }).join(", ");
            return [decorationFromSym(message, operatorToken)];
        }
        return [];
    };
    TypeErrorChecker.prototype.checkAllowsGroup = function (fieldLookup, comp, field) {
        var validOps = fieldLookup[field.identifier.text.toLocaleLowerCase()].group;
        if (validOps.length === 0) {
            return [decorationFromSym(field.identifier.text + " does not support group comparisons", comp)];
        }
        if (validOps.filter(function (op) { return comp instanceof op; }).length === 0) {
            var message = "Valid comparisons are " + validOps.map(function (op) { return Symbols.getSymbolName(op); }).join(", ");
            return [decorationFromSym(message, comp)];
        }
        return [];
    };
    TypeErrorChecker.prototype.mapType = function (type) {
        switch (type) {
            case FieldType.Integer:
            case FieldType.Double:
                return Symbols.Number;
            default:
                return Symbols.String;
        }
    };
    TypeErrorChecker.prototype.checkRhsValue = function (_a, expectedType) {
        var value = _a.value;
        var symbolType = this.mapType(expectedType);
        var error = decorationFromSym("Expected value of type " + Symbols.getSymbolName(symbolType), value);
        // Potentially additonal checkers to validate value formats here: ex date and guid validators
        if (value instanceof Symbols.VariableExpression) {
            var varType = this.mapType(lowerDefinedVariables[value.name.text.toLocaleLowerCase()]);
            return varType === symbolType ? [] : [error];
        }
        switch (expectedType) {
            case FieldType.String:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Integer:
                return value instanceof symbolType ? [] : [error];
            case FieldType.DateTime:
                return value instanceof symbolType ? [] : [error];
            case FieldType.PlainText:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Html:
                return value instanceof symbolType ? [] : [error];
            case FieldType.TreePath:
                return value instanceof symbolType ? [] : [error];
            case FieldType.History:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Double:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Guid:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Boolean:
                return value instanceof Symbols.True || value instanceof Symbols.False ? [] :
                    [decorationFromSym("Expected value of type BOOLEAN", value)];
        }
        throw new Error("Unexpected field type " + expectedType);
    };
    TypeErrorChecker.prototype.checkRhsGroup = function (valueList, expectedType) {
        var errors = [];
        var currList = valueList;
        while (currList) {
            if (currList.value.value instanceof Symbols.Field) {
                errors.push(decorationFromSym("Values in list must be literals", currList.value.value));
            }
            else {
                errors.push.apply(errors, this.checkRhsValue(currList.value, expectedType));
            }
            currList = currList.restOfList;
        }
        return errors;
    };
    TypeErrorChecker.prototype.checkRhsField = function (fieldLookup, targetField, expectedType) {
        if (targetField.identifier.text.toLocaleLowerCase() in fieldLookup
            && fieldLookup[targetField.identifier.text.toLocaleLowerCase()].fieldType !== expectedType) {
            return [decorationFromSym("Expected field of type " + FieldType[expectedType], targetField.identifier)];
        }
        return [];
    };
    TypeErrorChecker.prototype.getRhsType = function (value) {
        if (value && value.value instanceof Symbols.Field) {
            return "field";
        }
        return "literal";
    };
    TypeErrorChecker.prototype.check = function (parseResult) {
        return __awaiter(this, void 0, void 0, function () {
            var fieldLookup, errors, allConditions, _i, allConditions_1, condition, type, rhsType, compErrors, targetField;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fieldLookup.getValue()];
                    case 1:
                        fieldLookup = _a.sent();
                        errors = [];
                        allConditions = __spreadArrays(symbolsOfType(parseResult, Symbols.ConditionalExpression), symbolsOfType(parseResult, Symbols.LinkCondition));
                        for (_i = 0, allConditions_1 = allConditions; _i < allConditions_1.length; _i++) {
                            condition = allConditions_1[_i];
                            if (!condition.field || !(condition.field.identifier.text.toLocaleLowerCase() in fieldLookup)) {
                                continue;
                            }
                            type = fieldLookup[condition.field.identifier.text.toLocaleLowerCase()].fieldType;
                            if (condition.conditionalOperator) {
                                rhsType = this.getRhsType(condition.value);
                                compErrors = this.checkComparisonOperator(fieldLookup, condition.conditionalOperator, condition.field, rhsType);
                                if (compErrors.length > 0) {
                                    errors.push.apply(errors, compErrors);
                                    continue;
                                }
                                if (condition.value) {
                                    if (condition.value.value instanceof Symbols.Field) {
                                        targetField = condition.value.value;
                                        errors.push.apply(errors, this.checkRhsField(fieldLookup, targetField, type));
                                    }
                                    else {
                                        errors.push.apply(errors, this.checkRhsValue(condition.value, type));
                                    }
                                }
                            }
                            else if (condition.valueList && condition.inOperator) {
                                errors.push.apply(errors, this.checkRhsGroup(condition.valueList, type));
                                errors.push.apply(errors, this.checkAllowsGroup(fieldLookup, condition.inOperator, condition.field));
                            }
                        }
                        return [2 /*return*/, errors];
                }
            });
        });
    };
    return TypeErrorChecker;
}());
export { TypeErrorChecker };
//# sourceMappingURL=TypeErrorChecker.js.map