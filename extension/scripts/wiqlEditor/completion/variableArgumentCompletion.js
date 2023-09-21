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
import { isInVariable } from "./isIn";
import { pushStringCompletions } from "./pushStringCompletions";
function getSingleTeamArgumentCompletion(ctx, _a) {
    var args = _a.args;
    return __awaiter(this, void 0, void 0, function () {
        var projects, teamArg, teamMatch, project, lower, teams;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args || args.length !== 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, projectsVal.getValue()];
                case 1:
                    projects = (_b.sent()).map(function (_a) {
                        var name = _a.name;
                        return name;
                    });
                    teamArg = ctx.parseNext.errorToken.text;
                    if (!(ctx.parseNext.errorToken instanceof Symbols.NonterminatingString) || !teamArg || teamArg.match(/^['"]$/)) {
                        return [2 /*return*/, projects.map(function (p) { return "[" + p + "]"; })];
                    }
                    teamMatch = teamArg.match(/^['"]\[(.+)\]\\(.*)$/);
                    if (!teamMatch) {
                        return [2 /*return*/, []];
                    }
                    project = teamMatch[1];
                    lower = function (s) { return s.toLocaleLowerCase(); };
                    if (projects.map(lower).indexOf(lower(project)) < 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, getTeams(lower(project))];
                case 2:
                    teams = _b.sent();
                    return [2 /*return*/, teams.map(function (_a) {
                            var name = _a.name;
                            return name;
                        })];
            }
        });
    });
}
export function getVariableParameterCompletions(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var completions, varCtx, strings, _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    completions = [];
                    varCtx = isInVariable(ctx);
                    if (!varCtx) {
                        return [2 /*return*/, completions];
                    }
                    strings = [];
                    _a = varCtx.name.toLocaleLowerCase();
                    switch (_a) {
                        case "@currentiteration": return [3 /*break*/, 1];
                        case "@teamareas": return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 3];
                case 1:
                    _c = (_b = strings.push).apply;
                    _d = [strings];
                    return [4 /*yield*/, getSingleTeamArgumentCompletion(ctx, varCtx)];
                case 2:
                    _c.apply(_b, _d.concat([_e.sent()]));
                    return [3 /*break*/, 3];
                case 3:
                    pushStringCompletions(ctx, strings, completions);
                    return [2 /*return*/, completions];
            }
        });
    });
}
//# sourceMappingURL=variableArgumentCompletion.js.map