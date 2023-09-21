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
import { getClient } from "TFS/Core/RestClient";
import { CachedValue } from "../CachedValue";
import * as ExtensionCache from "./extensionCache";
import { throttlePromises } from "./throttlePromises";
function hardGetAllIdentitiesInTeam(project, team) {
    return __awaiter(this, void 0, void 0, function () {
        var teamIdentity, client, members, teamId, members, teamId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    teamIdentity = { displayName: "[" + project.name + "]\\" + team.name, id: team.id, isContainer: true };
                    client = getClient();
                    if (!("getTeamMembers" in client)) return [3 /*break*/, 2];
                    return [4 /*yield*/, client.getTeamMembers(project.id, team.id)];
                case 1:
                    members = _a.sent();
                    teamId = {
                        team: teamIdentity,
                        members: members,
                    };
                    return [2 /*return*/, teamId];
                case 2: return [4 /*yield*/, client.getTeamMembersWithExtendedProperties(project.id, team.id)];
                case 3:
                    members = _a.sent();
                    teamId = {
                        team: teamIdentity,
                        members: members.map(function (_a) {
                            var identity = _a.identity;
                            return identity;
                        }),
                    };
                    return [2 /*return*/, teamId];
            }
        });
    });
}
function getTeamsRest(project, top, skip) {
    return __awaiter(this, void 0, void 0, function () {
        var client, get;
        return __generator(this, function (_a) {
            client = getClient();
            get = client.getTeams.bind(client);
            if (get.length === 3) {
                // fallback
                return [2 /*return*/, get(project, top, skip)];
            }
            // latest version
            return [2 /*return*/, get(project, false, top, skip)];
        });
    });
}
function hardGetAllIdentitiesInProject(proj) {
    return __awaiter(this, void 0, void 0, function () {
        function hardGetAllIdentitiesInProjectImpl(project, skip) {
            return __awaiter(this, void 0, void 0, function () {
                var teamIds, teamPromises, moreTeamsPromise, _a, teams, moreTeams;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getTeamsRest(project.id, 100, skip)];
                        case 1:
                            teamIds = _b.sent();
                            teamPromises = throttlePromises(teamIds, function (t) { return hardGetAllIdentitiesInTeam(project, t); }, 10);
                            moreTeamsPromise = Promise.resolve(null);
                            if (teamIds.length === 100) {
                                moreTeamsPromise = hardGetAllIdentitiesInProjectImpl(project, skip + 100);
                            }
                            return [4 /*yield*/, Promise.all([teamPromises, moreTeamsPromise])];
                        case 2:
                            _a = _b.sent(), teams = _a[0], moreTeams = _a[1];
                            return [2 /*return*/, {
                                    id: project.id,
                                    name: project.name,
                                    teams: __spreadArrays(teams, (moreTeams ? moreTeams.teams : [])),
                                }];
                    }
                });
            });
        }
        return __generator(this, function (_a) {
            return [2 /*return*/, hardGetAllIdentitiesInProjectImpl(proj, 0)];
        });
    });
}
function hardGetAllIdentitiesInAllProjects() {
    return __awaiter(this, void 0, void 0, function () {
        var projects;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getClient().getProjects()];
                case 1:
                    projects = _a.sent();
                    return [2 /*return*/, Promise.all(projects.map(function (p) { return hardGetAllIdentitiesInProject(p); }))];
            }
        });
    });
}
var identityMap = {};
var identitiesKey = "identities";
export function getIdentities(project) {
    return __awaiter(this, void 0, void 0, function () {
        function tryGetIdentities() {
            return __awaiter(this, void 0, void 0, function () {
                function toIdentityArr(projects) {
                    var idMap = {};
                    for (var _i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
                        var teams = projects_1[_i].teams;
                        for (var _a = 0, teams_1 = teams; _a < teams_1.length; _a++) {
                            var _b = teams_1[_a], team = _b.team, members = _b.members;
                            idMap[team.id] = team;
                            for (var _c = 0, members_1 = members; _c < members_1.length; _c++) {
                                var member = members_1[_c];
                                idMap[member.id] = member;
                            }
                        }
                    }
                    return Object.keys(idMap).map(function (id) { return idMap[id]; });
                }
                var identities, expiration, projectIdents, projectIdents;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, ExtensionCache.get(key)];
                        case 1:
                            identities = _a.sent();
                            if (identities) {
                                return [2 /*return*/, toIdentityArr(identities)];
                            }
                            expiration = new Date();
                            expiration.setDate(expiration.getDate() + 7);
                            if (!project) return [3 /*break*/, 3];
                            return [4 /*yield*/, hardGetAllIdentitiesInProject(project)];
                        case 2:
                            projectIdents = _a.sent();
                            ExtensionCache.store(key, [projectIdents]);
                            return [2 /*return*/, toIdentityArr([projectIdents])];
                        case 3: return [4 /*yield*/, hardGetAllIdentitiesInAllProjects()];
                        case 4:
                            projectIdents = _a.sent();
                            ExtensionCache.store(key, projectIdents);
                            return [2 /*return*/, toIdentityArr(projectIdents)];
                    }
                });
            });
        }
        var key;
        return __generator(this, function (_a) {
            key = identitiesKey + "-" + (project ? project.name : "");
            if (key in identityMap) {
                return [2 /*return*/, identityMap[key].getValue()];
            }
            if (!(key in identityMap)) {
                identityMap[key] = new CachedValue(tryGetIdentities);
            }
            return [2 /*return*/, identityMap[key].getValue()];
        });
    });
}
//# sourceMappingURL=getIdentities.js.map