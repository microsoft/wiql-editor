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
import * as React from "react";
import * as ReactDom from "react-dom";
import { DelayedFunction } from "VSS/Utils/Core";
import { trackEvent } from "../events";
import { getCurrentTheme } from "../getCurrentTheme";
import { parse } from "./compiler/parser";
import { completionProvider } from "./completion/completion";
import { ErrorChecker } from "./errorCheckers/ErrorChecker";
import { format } from "./formatter";
import { getHoverProvider } from "./hoverProvider";
import { exportWiq, importWiq } from "./importExport";
import * as Wiql from "./wiqlDefinition";
function renderToolbar(callback) {
    var elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(React.createElement("div", { className: "header" },
        React.createElement("span", { className: "bowtie" },
            React.createElement("input", { className: "wiq-input", accept: ".wiq", type: "file" }),
            React.createElement("button", { onClick: function () { return $(".wiq-input").click(); } }, "Import"),
            React.createElement("button", { className: "wiq-export" }, "Export"),
            React.createElement("button", { className: "open-in-queries", hidden: true }, "Open in queries")),
        React.createElement("span", { className: "links" },
            React.createElement("a", { href: "https://marketplace.visualstudio.com/items?itemName=ms-devlabs.wiql-editor", target: "_blank" }, "Review"),
            " | ",
            React.createElement("a", { href: "https://github.com/microsoft/wiql-editor/issues", target: "_blank" }, "Report an issue"))), elem, callback);
}
export function setupEditor(target, onChange, intialValue, queryName) {
    var _this = this;
    renderToolbar(function () { return __awaiter(_this, void 0, void 0, function () {
        var navigationService;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (queryName) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, VSS.getService(VSS.ServiceIds.Navigation)];
                case 1:
                    navigationService = _a.sent();
                    $(".open-in-queries").show().click(function () {
                        var wiql = editor.getModel().getValue();
                        trackEvent("openInQueries", { wiqlLength: String(wiql.length) });
                        var _a = VSS.getWebContext(), host = _a.host, project = _a.project;
                        var url = host.uri + "/" + project.id + "/_queries/query/?wiql=" + encodeURIComponent(wiql);
                        navigationService.openNewWindow(url, "");
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    monaco.languages.register(Wiql.def);
    monaco.languages.onLanguage(Wiql.def.id, function () {
        monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
        monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
    });
    var defaultVal = "SELECT\n        [System.Id],\n        [System.WorkItemType],\n        [System.Title],\n        [System.State],\n        [System.AreaPath],\n        [System.IterationPath]\nFROM workitems\nWHERE\n        [System.TeamProject] = @project\nORDER BY [System.ChangedDate] DESC\n";
    var editor = monaco.editor.create(target, {
        language: Wiql.def.id,
        value: intialValue || defaultVal,
        automaticLayout: true,
        wordWrap: true,
        theme: getCurrentTheme() === "dark" ? "vs-dark" : "vs",
    });
    format(editor);
    editor.addAction({
        id: "format",
        contextMenuGroupId: "1_modification",
        label: "Format",
        keybindings: [
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
        ],
        run: function () { format(editor); return null; },
    });
    $(".wiq-input").change(function () { return importWiq(editor); });
    $(".wiq-export").click(function () { return exportWiq(editor, queryName); });
    monaco.languages.registerHoverProvider(Wiql.def.id, getHoverProvider());
    monaco.languages.registerCompletionItemProvider(Wiql.def.id, completionProvider);
    var model = editor.getModel();
    var errorChecker = new ErrorChecker();
    var oldDecorations = [];
    function checkErrors() {
        var lines = model.getLinesContent();
        var parseResult = parse(lines);
        return errorChecker.check(parseResult).then(function (errors) {
            oldDecorations = model.deltaDecorations(oldDecorations, errors);
            return errors.length;
        });
    }
    checkErrors();
    var updateErrors = new DelayedFunction(null, 200, "CheckErrors", function () {
        checkErrors().then(function (errorCount) {
            if (onChange) {
                onChange(errorCount);
            }
        });
    });
    editor.onDidChangeModelContent(function () {
        updateErrors.reset();
    });
    editor.focus();
    return editor;
}
//# sourceMappingURL=wiqlEditor.js.map