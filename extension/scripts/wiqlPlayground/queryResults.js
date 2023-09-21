var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import * as React from "react";
import * as ReactDom from "react-dom";
import { FieldType } from "TFS/WorkItemTracking/Contracts";
import { localeFormat, parseDateString } from "VSS/Utils/Date";
import { fieldsVal } from "../cachedData/fields";
var WorkItemRow = /** @class */ (function (_super) {
    __extends(WorkItemRow, _super);
    function WorkItemRow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WorkItemRow.prototype.render = function () {
        var _a = this.props, fields = _a.fields, columns = _a.columns, wi = _a.wi, rel = _a.rel;
        var uri = VSS.getWebContext().host.uri;
        var project = VSS.getWebContext().project.name;
        var wiUrl = "" + uri + project + "/_workitems?id=" + wi.id + "&_a=edit&fullScreen=true";
        var tds = [];
        if (rel) {
            tds.push(React.createElement("div", { className: "cell", title: "Link Type" }, rel));
        }
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var fieldRef = columns_1[_i];
            var value = wi.fields[fieldRef.referenceName];
            var field = fields.getField(fieldRef.referenceName);
            if (field && field.type === FieldType.DateTime) {
                var date = parseDateString(value);
                value = localeFormat(date);
            }
            tds.push(React.createElement("div", { className: "cell", title: fieldRef.name }, value));
        }
        return (React.createElement("a", { className: "row", tabIndex: 0, href: wiUrl, target: "_blank", rel: "noreferrer", onKeyDown: function (e) {
                if (e.keyCode === 40) {
                    $(":focus").next().focus();
                }
                if (e.keyCode === 38) {
                    $(":focus").prev().focus();
                }
            } }, tds));
    };
    return WorkItemRow;
}(React.Component));
var WorkItemTable = /** @class */ (function (_super) {
    __extends(WorkItemTable, _super);
    function WorkItemTable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WorkItemTable.prototype.render = function () {
        var _this = this;
        var wiMap = {};
        for (var _i = 0, _a = this.props.workItems; _i < _a.length; _i++) {
            var wi = _a[_i];
            wiMap[wi.id] = wi;
        }
        var workItems = this.props.result.workItems
            .filter(function (wi) { return wi.id in wiMap; })
            .map(function (wi) { return wiMap[wi.id]; });
        var rows = workItems.map(function (wi) { return React.createElement(WorkItemRow, { wi: wi, columns: _this.props.result.columns, fields: _this.props.fields }); });
        return React.createElement("div", { className: "table" }, rows);
    };
    return WorkItemTable;
}(React.Component));
var ResultCountDisclaimer = /** @class */ (function (_super) {
    __extends(ResultCountDisclaimer, _super);
    function ResultCountDisclaimer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ResultCountDisclaimer.prototype.render = function () {
        var message = this.props.count < 50 ? "Found " + this.props.count + " results" : "Showing first 50 results";
        return React.createElement("div", null, message);
    };
    return ResultCountDisclaimer;
}(React.Component));
var WorkItemRelationsTable = /** @class */ (function (_super) {
    __extends(WorkItemRelationsTable, _super);
    function WorkItemRelationsTable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WorkItemRelationsTable.prototype.render = function () {
        var _this = this;
        var wiMap = {};
        for (var _i = 0, _a = this.props.workItems; _i < _a.length; _i++) {
            var workitem = _a[_i];
            wiMap[workitem.id] = workitem;
        }
        var rows = this.props.result.workItemRelations
            .filter(function (wi) { return wi.target.id in wiMap; })
            .map(function (rel) {
            return React.createElement(WorkItemRow, { rel: rel.rel || "Source", columns: _this.props.result.columns, wi: wiMap[rel.target.id], fields: _this.props.fields });
        });
        return React.createElement("div", { className: "table" }, rows);
    };
    return WorkItemRelationsTable;
}(React.Component));
export function renderResult(result, workItems) {
    var table;
    fieldsVal.getValue().then(function (fields) {
        var props = { workItems: workItems, result: result, fields: fields };
        if (result.workItems) {
            table = React.createElement(WorkItemTable, __assign({}, props));
        }
        else {
            table = React.createElement(WorkItemRelationsTable, __assign({}, props));
        }
        ReactDom.render(React.createElement("div", null,
            table,
            React.createElement(ResultCountDisclaimer, { count: (result.workItems || result.workItemRelations).length })), document.getElementById("query-results"));
    });
}
export function setError(error) {
    var message = typeof error === "string" ? error : (error.serverError || error).message;
    ReactDom.render(React.createElement("div", { className: "error-message" }, message), document.getElementById("query-results"));
}
export function setMessage(message) {
    if (typeof message === "string") {
        message = [message];
    }
    var messageElems = message.map(function (m) { return React.createElement("div", null, m); });
    ReactDom.render(React.createElement("div", null, messageElems), document.getElementById("query-results"));
}
export function setVersion() {
    var elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(React.createElement("div", { className: "header" },
        React.createElement("span", { className: "bowtie" },
            React.createElement("input", { className: "wiq-input", accept: ".wiq", type: "file" }),
            React.createElement("button", { onClick: function () { return $(".wiq-input").click(); } }, "Import"),
            React.createElement("button", { className: "wiq-export" }, "Export")),
        React.createElement("span", { className: "links" },
            React.createElement("a", { href: "https://marketplace.visualstudio.com/items?itemName=ms-devlabs.wiql-editor#review-details", target: "_blank" }, "Review"),
            " | ",
            React.createElement("a", { href: "https://github.com/microsoft/wiql-editor/issues", target: "_blank" }, "Report an issue"),
            " | ",
            React.createElement("a", { href: "mailto:wiqleditor@microsoft.com", target: "_blank" }, "Feedback and questions"))), elem);
}
VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService) {
    $("body").on("click", "a[href]", function (e) {
        if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            var link = $(e.target).closest("a[href]");
            var href = link.attr("href");
            if (href && !link.attr("download")) {
                navigationService.openNewWindow(href, "");
                e.stopPropagation();
                e.preventDefault();
            }
        }
    });
});
//# sourceMappingURL=queryResults.js.map