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
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";
export var allProjectWits = new CachedValue(getWits);
function getWits() {
    return __awaiter(this, void 0, void 0, function () {
        var witPromises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, projectsVal.getValue()];
                case 1:
                    witPromises = (_a.sent()).map(function (project) { return __awaiter(_this, void 0, void 0, function () {
                        var workItemTypes;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, getWitsByProjects([project.name])];
                                case 1:
                                    workItemTypes = _a.sent();
                                    return [2 /*return*/, { project: project, workItemTypes: workItemTypes }];
                            }
                        });
                    }); });
                    return [2 /*return*/, Promise.all(witPromises)];
            }
        });
    });
}
var projectsToWit = {};
export function getWitsByProjects(projects, searchWits) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_1, _i, projects_1, project, witsArr, wits, _a, witsArr_1, arr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _loop_1 = function (project) {
                        if (!(project in projectsToWit)) {
                            projectsToWit[project] = new CachedValue(function () { return getWitClient().getWorkItemTypes(project); });
                        }
                    };
                    for (_i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
                        project = projects_1[_i];
                        _loop_1(project);
                    }
                    return [4 /*yield*/, Promise.all(projects.map(function (p) { return projectsToWit[p].getValue(); }))];
                case 1:
                    witsArr = _b.sent();
                    wits = [];
                    for (_a = 0, witsArr_1 = witsArr; _a < witsArr_1.length; _a++) {
                        arr = witsArr_1[_a];
                        wits.push.apply(wits, arr);
                    }
                    return [2 /*return*/, searchWits ? wits.filter(function (w) { return searchWits.some(function (w2) { return w2 === w.name; }); }) : wits];
            }
        });
    });
}
export function getWitNamesByProjects(projects) {
    return __awaiter(this, void 0, void 0, function () {
        var wits, names, _i, wits_1, name_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (projects.length === 0) {
                        getWitNames();
                    }
                    return [4 /*yield*/, getWitsByProjects(projects)];
                case 1:
                    wits = _a.sent();
                    names = {};
                    for (_i = 0, wits_1 = wits; _i < wits_1.length; _i++) {
                        name_1 = wits_1[_i].name;
                        names[name_1] = void 0;
                    }
                    return [2 /*return*/, Object.keys(names)];
            }
        });
    });
}
export function getStatesByProjects(projects, searchWits) {
    return __awaiter(this, void 0, void 0, function () {
        var wits, states, _i, wits_2, transitions, startState, _a, _b, targetState;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getWitsByProjects(projects, searchWits)];
                case 1:
                    wits = _c.sent();
                    states = {};
                    for (_i = 0, wits_2 = wits; _i < wits_2.length; _i++) {
                        transitions = wits_2[_i].transitions;
                        for (startState in transitions) {
                            if (startState) {
                                states[startState] = undefined;
                            }
                            for (_a = 0, _b = transitions[startState]; _a < _b.length; _a++) {
                                targetState = _b[_a].to;
                                if (targetState) {
                                    states[targetState] = undefined;
                                }
                            }
                        }
                    }
                    return [2 /*return*/, Object.keys(states)];
            }
        });
    });
}
export var statesVal = new CachedValue(getStates);
function getStates() {
    return __awaiter(this, void 0, void 0, function () {
        var witsByProj, states, _i, witsByProj_1, workItemTypes, _a, workItemTypes_1, transitions, startState, _b, _c, targetState;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, allProjectWits.getValue()];
                case 1:
                    witsByProj = _d.sent();
                    states = {};
                    for (_i = 0, witsByProj_1 = witsByProj; _i < witsByProj_1.length; _i++) {
                        workItemTypes = witsByProj_1[_i].workItemTypes;
                        for (_a = 0, workItemTypes_1 = workItemTypes; _a < workItemTypes_1.length; _a++) {
                            transitions = workItemTypes_1[_a].transitions;
                            for (startState in transitions) {
                                if (startState) {
                                    states[startState] = undefined;
                                }
                                for (_b = 0, _c = transitions[startState]; _b < _c.length; _b++) {
                                    targetState = _c[_b].to;
                                    if (targetState) {
                                        states[targetState] = undefined;
                                    }
                                }
                            }
                        }
                    }
                    return [2 /*return*/, Object.keys(states)];
            }
        });
    });
}
export var witNames = new CachedValue(getWitNames);
function getWitNames() {
    return __awaiter(this, void 0, void 0, function () {
        var witsByProj, wits, _i, witsByProj_2, workItemTypes, _a, workItemTypes_2, name_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, allProjectWits.getValue()];
                case 1:
                    witsByProj = _b.sent();
                    wits = {};
                    for (_i = 0, witsByProj_2 = witsByProj; _i < witsByProj_2.length; _i++) {
                        workItemTypes = witsByProj_2[_i].workItemTypes;
                        for (_a = 0, workItemTypes_2 = workItemTypes; _a < workItemTypes_2.length; _a++) {
                            name_2 = workItemTypes_2[_a].name;
                            wits[name_2] = undefined;
                        }
                    }
                    return [2 /*return*/, Object.keys(wits)];
            }
        });
    });
}
//# sourceMappingURL=workItemTypes.js.map