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
import { callApi } from "../RestCall";
import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";
export var allTagsVal = new CachedValue(getAllTags);
function getAllTags() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = getTagsForProjects;
                    return [4 /*yield*/, projectsVal.getValue()];
                case 1: return [4 /*yield*/, _a.apply(void 0, [(_b.sent()).map(function (p) { return p.name; })])];
                case 2: return [2 /*return*/, _b.sent()];
            }
        });
    });
}
var tagsMap = {};
export function getTagsForProjects(projectIds) {
    if (projectIds.length === 0) {
        return allTagsVal.getValue();
    }
    var _loop_1 = function (projectId) {
        if (!(projectId in tagsMap)) {
            tagsMap[projectId] = new CachedValue(function () { return getTagsForProject(projectId); });
        }
    };
    for (var _i = 0, projectIds_1 = projectIds; _i < projectIds_1.length; _i++) {
        var projectId = projectIds_1[_i];
        _loop_1(projectId);
    }
    return Promise.all(projectIds.map(function (p) { return getTagsForProject(p); })).then(function (tagsArr) {
        var allTags = {};
        for (var _i = 0, tagsArr_1 = tagsArr; _i < tagsArr_1.length; _i++) {
            var tags = tagsArr_1[_i];
            for (var _a = 0, tags_1 = tags; _a < tags_1.length; _a++) {
                var tag = tags_1[_a];
                allTags[tag] = undefined;
            }
        }
        return Object.keys(allTags);
    });
}
function getTagsForProject(project) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, ref, webContext, tagsUrl;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0;
                    return [4 /*yield*/, projectsVal.getValue()];
                case 1:
                    _a = _b.sent();
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    ref = _a[_i];
                    if (ref.name.toLocaleLowerCase() === project.toLocaleLowerCase()) {
                        project = ref.id;
                        return [3 /*break*/, 4];
                    }
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 2];
                case 4:
                    webContext = VSS.getWebContext();
                    tagsUrl = webContext.account.uri;
                    if (!tagsUrl.match(/DefaultCollection/i)) {
                        tagsUrl += "DefaultCollection/";
                    }
                    tagsUrl += "_apis/tagging/scopes/" + project + "/tags?api-version=1.0";
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            callApi(tagsUrl, "GET", undefined, undefined, function (tags) {
                                resolve(tags.value.map(function (t) { return t.name; }));
                            }, reject);
                        })];
            }
        });
    });
}
//# sourceMappingURL=tags.js.map