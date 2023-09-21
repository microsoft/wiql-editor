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
import { projectsVal } from "../../cachedData/projects";
import { getTeams } from "../../cachedData/teams";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { decorationFromString, decorationFromSym } from "./errorDecorations";
var VariableParametersChecker = /** @class */ (function () {
    function VariableParametersChecker() {
    }
    VariableParametersChecker.prototype.checkSingleParameterVariable = function (variable) {
        return __awaiter(this, void 0, void 0, function () {
            var name, errors, teamMatch, project, team, projects, lower, teams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        name = variable.name.text;
                        errors = [];
                        if (!variable.args) {
                            return [2 /*return*/, errors];
                        }
                        if (variable.args.args) {
                            errors.push(decorationFromSym(name + " only takes 1 argument", variable.args));
                        }
                        if (!(variable.args.value instanceof Symbols.String)) {
                            errors.push(decorationFromSym("Team must be a string", variable.args.value));
                            return [2 /*return*/, errors];
                        }
                        teamMatch = variable.args.value.text.match(/['"]\[(.+)\]\\(.+)( <.*>)?['"]/);
                        if (!teamMatch) {
                            errors.push(decorationFromSym("Team must be of format '[project]\\team'", variable.args.value));
                            return [2 /*return*/, errors];
                        }
                        project = teamMatch[1], team = teamMatch[2];
                        return [4 /*yield*/, projectsVal.getValue()];
                    case 1:
                        projects = (_a.sent()).map(function (_a) {
                            var projName = _a.name;
                            return projName;
                        });
                        lower = function (s) { return s.toLocaleLowerCase(); };
                        if (projects.map(lower).indexOf(lower(project)) < 0) {
                            errors.push(decorationFromString("Project does not exist - expecting one of\n\n " + projects.join(", "), variable.args.value, 2, project.length));
                            return [2 /*return*/, errors];
                        }
                        return [4 /*yield*/, getTeams(lower(project))];
                    case 2:
                        teams = (_a.sent()).map(function (_a) {
                            var teamName = _a.name;
                            return teamName;
                        });
                        if (teams.map(lower).indexOf(lower(team)) < 0) {
                            errors.push(decorationFromString("Team does not exist - expecting one of\n\n " + teams.join(", "), variable.args.value, 4 + project.length, team.length));
                        }
                        return [2 /*return*/, errors];
                }
            });
        });
    };
    VariableParametersChecker.prototype.checkToday = function (variable) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (variable.args) {
                    return [2 /*return*/, [decorationFromSym("@Today does not accept arguments", variable.args)]];
                }
                return [2 /*return*/, []];
            });
        });
    };
    VariableParametersChecker.prototype.checkDefault = function (variable) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, name;
            return __generator(this, function (_a) {
                errors = [];
                name = variable.name.text;
                if (variable.args) {
                    errors.push(decorationFromSym(name + " does not accept arguments", variable.args));
                }
                if (variable.operator && variable.num) {
                    errors.push(decorationFromSym(name + " does not accept an offset", [variable.operator, variable.num]));
                }
                return [2 /*return*/, errors];
            });
        });
    };
    VariableParametersChecker.prototype.checkVariable = function (variable) {
        switch (variable.name.text.toLocaleLowerCase()) {
            case "@currentiteration":
            case "@teamareas":
                return this.checkSingleParameterVariable(variable);
            case "@today":
                return this.checkToday(variable);
            default:
                return this.checkDefault(variable);
        }
    };
    VariableParametersChecker.prototype.check = function (parseResult) {
        return __awaiter(this, void 0, void 0, function () {
            var variables, errors, _i, variables_1, variable, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        variables = symbolsOfType(parseResult, Symbols.VariableExpression);
                        errors = [];
                        _i = 0, variables_1 = variables;
                        _d.label = 1;
                    case 1:
                        if (!(_i < variables_1.length)) return [3 /*break*/, 4];
                        variable = variables_1[_i];
                        _b = (_a = errors.push).apply;
                        _c = [errors];
                        return [4 /*yield*/, this.checkVariable(variable)];
                    case 2:
                        _b.apply(_a, _c.concat([_d.sent()]));
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, errors];
                }
            });
        });
    };
    return VariableParametersChecker;
}());
export { VariableParametersChecker };
//# sourceMappingURL=VariableParametersChecker.js.map