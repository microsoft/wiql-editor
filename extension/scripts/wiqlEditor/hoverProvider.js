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
import { FieldType } from "TFS/WorkItemTracking/Contracts";
import { fieldsVal } from "../cachedData/fields";
import { getWitsByProjects } from "../cachedData/workItemTypes";
import { parse } from "./compiler/parser";
import * as Symbols from "./compiler/symbols";
import { symbolsAtPosition } from "./parseAnalysis/findSymbol";
import { getFilters } from "./parseAnalysis/whereClauses";
import { lowerDefinedVariables } from "./wiqlDefinition";
function toRange(token) {
    return new monaco.Range(token.line + 1, token.startColumn + 1, token.line + 1, token.endColumn + 1);
}
function getFieldHover(hoverSymbols, parseResult) {
    return __awaiter(this, void 0, void 0, function () {
        var id, _a, fields, filters, matchedField, hovers, range, workItemTypes, descriptionSet, descriptions, _i, workItemTypes_1, wit, _b, _c, field, descriptionArr;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    id = hoverSymbols.filter(function (s) { return s instanceof Symbols.Identifier; })[0];
                    if (!id) return [3 /*break*/, 3];
                    return [4 /*yield*/, Promise.all([fieldsVal.getValue(), getFilters(parseResult)])];
                case 1:
                    _a = _d.sent(), fields = _a[0], filters = _a[1];
                    matchedField = fields.getField(id.text);
                    if (!matchedField) return [3 /*break*/, 3];
                    hovers = [FieldType[matchedField.type]];
                    range = toRange(id);
                    return [4 /*yield*/, getWitsByProjects(filters.projects, filters.workItemTypes)];
                case 2:
                    workItemTypes = _d.sent();
                    descriptionSet = {};
                    descriptions = {};
                    for (_i = 0, workItemTypes_1 = workItemTypes; _i < workItemTypes_1.length; _i++) {
                        wit = workItemTypes_1[_i];
                        for (_b = 0, _c = wit.fieldInstances; _b < _c.length; _b++) {
                            field = _c[_b];
                            if (field.referenceName === matchedField.referenceName && field.helpText) {
                                descriptions[wit.name] = field.helpText;
                                descriptionSet[field.helpText] = void 0;
                            }
                        }
                    }
                    descriptionArr = Object.keys(descriptionSet);
                    // Don't show the description if it differs by wit
                    if (descriptionArr.length === 1) {
                        hovers.push(descriptionArr[0]);
                    }
                    return [2 /*return*/, { contents: hovers, range: range }];
                case 3: return [2 /*return*/, null];
            }
        });
    });
}
function getVariableHover(hoverSymbols) {
    var variable = hoverSymbols.filter(function (s) { return s instanceof Symbols.VariableExpression; })[0];
    if (variable) {
        var matchedVariable = variable.name.text.toLocaleLowerCase() in lowerDefinedVariables;
        if (matchedVariable) {
            var hovers = [];
            hovers.push(FieldType[lowerDefinedVariables[variable.name.text.toLocaleLowerCase()]]);
            var range = toRange(variable.name);
            return { contents: hovers, range: range };
        }
    }
}
function getWitHover(hoverSymbols, parseResult) {
    return __awaiter(this, void 0, void 0, function () {
        var witExpression, firstSymbol, witText, searchWit_1, filters, workItemTypes, matchingWits;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    witExpression = hoverSymbols.filter(function (s) {
                        return s instanceof Symbols.ConditionalExpression &&
                            s.field &&
                            (s.field.identifier.text.toLocaleLowerCase() === "system.workitemtype" ||
                                s.field.identifier.text.toLocaleLowerCase() === "work item type");
                    })[0];
                    firstSymbol = hoverSymbols[0];
                    if (!(firstSymbol instanceof Symbols.String &&
                        witExpression)) return [3 /*break*/, 3];
                    witText = firstSymbol.text;
                    searchWit_1 = witText.substr(1, witText.length - 2);
                    return [4 /*yield*/, getFilters(parseResult)];
                case 1:
                    filters = _a.sent();
                    return [4 /*yield*/, getWitsByProjects(filters.projects, filters.workItemTypes)];
                case 2:
                    workItemTypes = _a.sent();
                    matchingWits = workItemTypes.filter(function (w) { return w.name.toLocaleLowerCase() === searchWit_1.toLocaleLowerCase(); });
                    if (matchingWits.length !== 1) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, { contents: [matchingWits[0].description], range: toRange(firstSymbol) }];
                case 3: return [2 /*return*/, null];
            }
        });
    });
}
export function getHoverProvider() {
    var _this = this;
    return {
        provideHover: function (model, position) { return __awaiter(_this, void 0, void 0, function () {
            var lines, parseResult, hoverSymbols, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        lines = model.getLinesContent();
                        parseResult = parse(lines);
                        hoverSymbols = symbolsAtPosition(position.lineNumber, position.column, parseResult);
                        return [4 /*yield*/, getFieldHover(hoverSymbols, parseResult)];
                    case 1:
                        _b = (_c.sent());
                        if (_b) return [3 /*break*/, 3];
                        return [4 /*yield*/, getVariableHover(hoverSymbols)];
                    case 2:
                        _b = (_c.sent());
                        _c.label = 3;
                    case 3:
                        _a = _b;
                        if (_a) return [3 /*break*/, 5];
                        return [4 /*yield*/, getWitHover(hoverSymbols, parseResult)];
                    case 4:
                        _a = (_c.sent());
                        _c.label = 5;
                    case 5: return [2 /*return*/, _a ||
                            null];
                }
            });
        }); },
    };
}
//# sourceMappingURL=hoverProvider.js.map