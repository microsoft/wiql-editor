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
import { trackEvent } from "../events";
function saveErrorMessage(error, query) {
    if (!isSupportedQueryId(query.id)) {
        return "Only queries in saved in My Queries or Shared Queries can be updated with this extension";
    }
    var exception = (error.serverError || error);
    // tslint:disable-next-line:no-string-literal
    var message = (exception["message"] || exception["value"]["Message"]);
    return message;
}
export function showDialog(query) {
    return __awaiter(this, void 0, void 0, function () {
        function close() {
            trackEvent("keyboardExit");
            closeDialog();
        }
        function save() {
            var _this = this;
            okCallback().then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                var navigationService;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (typeof result !== "string") {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, VSS.getService(VSS.ServiceIds.Navigation)];
                        case 1:
                            navigationService = _a.sent();
                            if (result === "") {
                                navigationService.reload();
                            }
                            else {
                                navigationService.navigate(result);
                            }
                            return [2 /*return*/];
                    }
                });
            }); }, function (error) {
                var message = saveErrorMessage(error, query);
                dialogService.openMessageDialog(message, {
                    title: "Error saving query",
                });
                trackEvent("SaveQueryFailure", { message: message });
            });
            throw Error("Exception to block dialog close");
        }
        var dialogService, okCallback, closeDialog, context, dialogOptions, extInfo, contentContribution, dialog;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, VSS.getService(VSS.ServiceIds.Dialog)];
                case 1:
                    dialogService = _a.sent();
                    okCallback = function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            throw new Error("ok callback not set");
                        });
                    }); };
                    closeDialog = function () {
                        throw new Error("could not find close dialog function");
                    };
                    context = {
                        query: query,
                        save: save,
                        close: close,
                        loaded: function (callbacks) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                okCallback = callbacks.okCallback;
                                dialog.updateOkButton(true);
                                return [2 /*return*/];
                            });
                        }); },
                    };
                    dialogOptions = {
                        title: query.name,
                        width: Number.MAX_VALUE,
                        height: Number.MAX_VALUE,
                        getDialogResult: save,
                        okText: "Save Query",
                        resizable: true,
                    };
                    extInfo = VSS.getExtensionContext();
                    contentContribution = extInfo.publisherId + "." + extInfo.extensionId + ".contextForm";
                    return [4 /*yield*/, dialogService.openDialog(contentContribution, dialogOptions, context)];
                case 2:
                    dialog = _a.sent();
                    closeDialog = function () { return dialog.close(); };
                    return [2 /*return*/];
            }
        });
    });
}
var WellKnownQueries;
(function (WellKnownQueries) {
    WellKnownQueries.AssignedToMe = "A2108D31-086C-4FB0-AFDA-097E4CC46DF4";
    WellKnownQueries.UnsavedWorkItems = "B7A26A56-EA87-4C97-A504-3F028808BB9F";
    WellKnownQueries.FollowedWorkItems = "202230E0-821E-401D-96D1-24A7202330D0";
    WellKnownQueries.CreatedBy = "53FB153F-C52C-42F1-90B6-CA17FC3561A8";
    WellKnownQueries.SearchResults = "2CBF5136-1AE5-4948-B59A-36F526D9AC73";
    WellKnownQueries.CustomWiql = "08E20883-D56C-4461-88EB-CE77C0C7936D";
    WellKnownQueries.RecycleBin = "2650C586-0DE4-4156-BA0E-14BCFB664CCA";
})(WellKnownQueries || (WellKnownQueries = {}));
var queryExclusionList = [
    WellKnownQueries.AssignedToMe,
    WellKnownQueries.UnsavedWorkItems,
    WellKnownQueries.FollowedWorkItems,
    WellKnownQueries.CreatedBy,
    WellKnownQueries.SearchResults,
    WellKnownQueries.CustomWiql,
    WellKnownQueries.RecycleBin
];
export function isSupportedQueryId(id) {
    return queryExclusionList.indexOf(id.toUpperCase()) === -1;
}
//# sourceMappingURL=queryDialog.js.map