import "promise-polyfill/src/polyfill";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { trackEvent } from "../events";
import { setupEditor } from "../wiqlEditor/wiqlEditor";
import { renderResult, setError, setMessage } from "./queryResults";
trackEvent("pageLoad");
function loadWorkItems(result) {
    if (result.workItems.length === 0) {
        setMessage("No work items found");
        return;
    }
    setMessage("Loading workitems...");
    var wiIds = result.workItems.map(function (wi) { return wi.id; });
    var fieldRefNames = result.columns.map(function (col) { return col.referenceName; });
    getWitClient().getWorkItems(wiIds, fieldRefNames, result.asOf).then(function (workItems) { return renderResult(result, workItems); }, setError);
}
function loadWorkItemRelations(result) {
    if (result.workItemRelations.length === 0) {
        setMessage("No work item relations found");
        return;
    }
    setMessage("Loading workitem relations...");
    var ids = [];
    for (var _i = 0, _a = result.workItemRelations; _i < _a.length; _i++) {
        var relation = _a[_i];
        if (relation.source && ids.indexOf(relation.source.id) < 0) {
            ids.push(relation.source.id);
        }
        if (ids.indexOf(relation.target.id) < 0) {
            ids.push(relation.target.id);
        }
    }
    var fieldRefNames = result.columns.length < 10 ?
        result.columns.map(function (col) { return col.referenceName; })
        : undefined;
    getWitClient().getWorkItems(ids, fieldRefNames, result.asOf).then(function (workitems) { return renderResult(result, workitems); }, function (error) {
        var message = typeof error === "string" ? error : (error.serverError || error).message;
        trackEvent("GetWorkItemFailure", { message: message });
        setError(error);
    });
}
function search() {
    var wiqlText = editor.getValue();
    setMessage("Running query...");
    trackEvent("RunQuery", { wiqlLength: "" + wiqlText.length });
    var context = VSS.getWebContext();
    getWitClient().queryByWiql({ query: wiqlText }, context.project.name, context.team.name, true, 50).then(function (result) {
        result.workItems = result.workItems && result.workItems.splice(0, 50);
        result.workItemRelations = result.workItemRelations && result.workItemRelations.splice(0, 50);
        if (result.workItems) {
            loadWorkItems(result);
        }
        else {
            loadWorkItemRelations(result);
        }
    }, function (error) {
        var message = typeof error === "string" ? error : (error.serverError || error).message;
        trackEvent("RunQueryFailure", { message: message });
        setError(error);
    });
}
var target = document.getElementById("wiql-box");
if (!target) {
    throw new Error("Could not find wiql editor div");
}
var editor = setupEditor(target);
editor.addAction({
    id: "run",
    contextMenuGroupId: "results",
    label: "Run",
    keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
    keybindingContext: undefined,
    contextMenuOrder: 1,
    run: function () { search(); return null; },
});
editor.addAction({
    id: "focus-results",
    label: "Focus Results",
    contextMenuGroupId: "results",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KEY_R],
    run: function () {
        var trs = $(".row");
        if (trs.length > 0) {
            trs.first().focus();
        }
        return null;
    },
});
function getAction(id) {
    return function () { return editor.getActions().filter(function (a) { return a.id.match(":" + id + "$"); })[0].run(); };
}
$(".run-button").click(getAction("run"));
$(".format-button").click(getAction("format"));
setMessage([
    "Key bindings:",
    "Shift + Enter : Run",
    "Alt + Shift + F or Ctr + Shift + F : Format",
    "Alt + R : Apply focus to first result",
]);
// Register context menu action provider
VSS.register(VSS.getContribution().id, {});
//# sourceMappingURL=playground.js.map