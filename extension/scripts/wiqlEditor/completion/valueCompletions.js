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
import { identitiesVal, isIdentityField } from "../../cachedData/identities";
import { areaStrings, iterationStrings } from "../../cachedData/nodes";
import { projectsVal } from "../../cachedData/projects";
import { relationTypes } from "../../cachedData/relationTypes";
import { getTagsForProjects } from "../../cachedData/tags";
import { getCategories } from "../../cachedData/workitemTypeCategories";
import { getStatesByProjects, getWitNamesByProjects, witNames } from "../../cachedData/workItemTypes";
import * as Symbols from "../compiler/symbols";
import { getFilters } from "../parseAnalysis/whereClauses";
function getWitCompletions(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var projects, categories;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getFilters(ctx.getAssumedParse())];
                case 1:
                    projects = (_a.sent()).projects;
                    if (!(ctx.prevToken instanceof Symbols.Group)) return [3 /*break*/, 3];
                    return [4 /*yield*/, getCategories(projects)];
                case 2:
                    categories = _a.sent();
                    return [2 /*return*/, categories.map(function (c) { return c.referenceName; })];
                case 3:
                    if (projects.length === 0) {
                        return [2 /*return*/, witNames.getValue()];
                    }
                    return [2 /*return*/, getWitNamesByProjects(projects)];
            }
        });
    });
}
function getStateCompletions(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, projects, workItemTypes;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getFilters(ctx.getAssumedParse())];
                case 1:
                    _a = _b.sent(), projects = _a.projects, workItemTypes = _a.workItemTypes;
                    if (projects.length === 0) {
                        return [2 /*return*/, witNames.getValue()];
                    }
                    return [2 /*return*/, getStatesByProjects(projects, workItemTypes)];
            }
        });
    });
}
function getTagCompletions(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var projects;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getFilters(ctx.getAssumedParse())];
                case 1:
                    projects = (_a.sent()).projects;
                    if (projects.length === 0) {
                        projects.push(VSS.getWebContext().project.id);
                    }
                    return [2 /*return*/, getTagsForProjects(projects)];
            }
        });
    });
}
export function getStringValueCompletions(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var expectingString, projects, types;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectingString = ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0;
                    if (!(isIdentityField(ctx.fields, ctx.fieldRefName) && expectingString)) return [3 /*break*/, 1];
                    return [2 /*return*/, identitiesVal.getValue()];
                case 1:
                    if (!(ctx.fields.equalFields("System.TeamProject", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 3];
                    return [4 /*yield*/, projectsVal.getValue()];
                case 2:
                    projects = _a.sent();
                    return [2 /*return*/, projects.map(function (_a) {
                            var name = _a.name;
                            return name;
                        })];
                case 3:
                    if (!(ctx.fields.equalFields("System.State", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 4];
                    return [2 /*return*/, getStateCompletions(ctx)];
                case 4:
                    if (!(ctx.fields.equalFields("System.WorkItemType", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 5];
                    return [2 /*return*/, getWitCompletions(ctx)];
                case 5:
                    if (!(ctx.fields.equalFields("System.AreaPath", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 6];
                    return [2 /*return*/, areaStrings.getValue()];
                case 6:
                    if (!(ctx.fields.equalFields("System.IterationPath", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 7];
                    return [2 /*return*/, iterationStrings.getValue()];
                case 7:
                    if (!(ctx.fields.equalFields("System.Tags", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 8];
                    return [2 /*return*/, getTagCompletions(ctx)];
                case 8:
                    if (!(ctx.fields.equalFields("System.Links.LinkType", ctx.fieldRefName) && expectingString)) return [3 /*break*/, 10];
                    return [4 /*yield*/, relationTypes.getValue()];
                case 9:
                    types = _a.sent();
                    return [2 /*return*/, types.filter(function (t) { return t.attributes.usage === "workItemLink"; }).map(function (t) { return t.referenceName; })];
                case 10: return [2 /*return*/, []];
            }
        });
    });
}
//# sourceMappingURL=valueCompletions.js.map