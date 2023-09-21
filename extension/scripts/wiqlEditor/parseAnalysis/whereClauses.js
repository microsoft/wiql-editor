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
import { fieldsVal } from "../../cachedData/fields";
import { projectsVal } from "../../cachedData/projects";
import { getWitNamesByProjects } from "../../cachedData/workItemTypes";
import * as Symbols from "../compiler/symbols";
function getConditionalExpressions(logical) {
    var conditionals = [];
    var curr = logical;
    while (curr) {
        if (curr.condition) {
            if (curr.condition.expression) {
                conditionals.push.apply(conditionals, getConditionalExpressions(curr.condition.expression));
            }
            else if (curr.orAnd instanceof Symbols.Or) {
                /*
                All "or" statments are untrustworthy

                exp1 and (exp3 or exp3) => [exp1] + ([])
                */
                return [];
            }
            else {
                conditionals.push(curr.condition);
            }
        }
        curr = curr.expression;
    }
    return conditionals;
}
function getProjects(fields, conditionals) {
    var projectConditions = conditionals.filter(function (c) { return c.field && fields.equalFields("System.TeamProject", c.field.identifier.text); });
    if (projectConditions.some(function (c) {
        return !c.conditionalOperator ||
            !(c.conditionalOperator instanceof Symbols.ConditionalOperator) ||
            !(c.conditionalOperator.conditionToken instanceof Symbols.Equals) ||
            (!(c.value && c.value.value instanceof Symbols.String) &&
                !(c.value && c.value.value instanceof Symbols.Variable));
    })) {
        return [];
    }
    return projectConditions.map(function (c) {
        if (c.value && c.value.value instanceof Symbols.String) {
            var str = c.value.value.text;
            // Remove the quotes on the string text
            return str.substr(1, str.length - 2);
        }
        else if (c.value && c.value.value instanceof Symbols.Variable) {
            return VSS.getWebContext().project.name;
        }
        throw new Error("Value is unexpected type reading projects");
    });
}
function getWits(fields, conditionals) {
    var witConditions = conditionals.filter(function (c) { return c.field && fields.equalFields("System.WorkItemType", c.field.identifier.text); });
    if (witConditions.some(function (c) {
        return !c.conditionalOperator ||
            // TODO also allow in group
            !(c.conditionalOperator instanceof Symbols.ConditionalOperator) ||
            !(c.conditionalOperator.conditionToken instanceof Symbols.Equals) ||
            !(c.value && c.value.value instanceof Symbols.String);
    })) {
        return [];
    }
    return witConditions.map(function (c) {
        if (c.value && c.value.value instanceof Symbols.String) {
            var str = c.value.value.text;
            // Remove the quotes on the string text
            return str.substr(1, str.length - 2);
        }
        throw new Error("Value is unexpected type when reading wits");
    });
}
function toServerCasing(values, serverValues) {
    var serverValueMap = {};
    for (var _i = 0, serverValues_1 = serverValues; _i < serverValues_1.length; _i++) {
        var serverValue = serverValues_1[_i];
        serverValueMap[serverValue.toLocaleLowerCase()] = serverValue;
    }
    var uniqueValues = {};
    for (var _a = 0, values_1 = values; _a < values_1.length; _a++) {
        var value = values_1[_a];
        var properValue = serverValueMap[value.toLocaleLowerCase()];
        if (properValue && !(properValue in uniqueValues)) {
            uniqueValues[properValue] = void 0;
        }
    }
    return Object.keys(uniqueValues);
}
export function getFilters(parse) {
    return __awaiter(this, void 0, void 0, function () {
        var fields, foundProjects, foundWits, conditionalExpressions, projects, projectNames, uniqueProjects, witNames, uniqueWits, filters;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fieldsVal.getValue()];
                case 1:
                    fields = _a.sent();
                    foundProjects = [];
                    foundWits = [];
                    if ((parse instanceof Symbols.FlatSelect ||
                        parse instanceof Symbols.OneHopSelect ||
                        parse instanceof Symbols.RecursiveSelect) &&
                        parse.whereExp) {
                        conditionalExpressions = getConditionalExpressions(parse.whereExp);
                        foundProjects.push.apply(foundProjects, getProjects(fields, conditionalExpressions));
                        foundWits.push.apply(foundWits, getWits(fields, conditionalExpressions));
                    }
                    return [4 /*yield*/, projectsVal.getValue()];
                case 2:
                    projects = _a.sent();
                    projectNames = projects.map(function (p) { return p.name; });
                    uniqueProjects = toServerCasing(foundProjects, projectNames);
                    return [4 /*yield*/, getWitNamesByProjects(uniqueProjects)];
                case 3:
                    witNames = _a.sent();
                    uniqueWits = toServerCasing(foundWits, witNames);
                    filters = {
                        projects: uniqueProjects,
                        workItemTypes: uniqueWits,
                    };
                    return [2 /*return*/, filters];
            }
        });
    });
}
//# sourceMappingURL=whereClauses.js.map