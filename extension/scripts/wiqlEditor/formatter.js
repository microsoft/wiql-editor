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
import { FieldLookup, fieldsVal } from "../cachedData/fields";
import { parse } from "./compiler/parser";
import * as Symbols from "./compiler/symbols";
function insert(line, text) {
    var match = line.match(/(\s*)(.*)/);
    if (match) {
        return match[1] + text + match[2];
    }
    return line;
}
function tabs(tab, indent) {
    return Array(indent + 1).join(tab);
}
function formatField(field, fields) {
    var foundField = fields.getField(field.identifier.text.toLocaleLowerCase());
    return "[" + (foundField ? foundField.referenceName : field.identifier.text) + "]";
}
function formatFieldList(fieldList, fields, tab) {
    var lines = [];
    var currFieldList = fieldList;
    while (currFieldList) {
        var comma = currFieldList.restOfList ? "," : "";
        lines.push(tab + formatField(currFieldList.field, fields) + comma);
        currFieldList = currFieldList.restOfList;
    }
    return lines;
}
function formatNumber(num) {
    return (num.minus ? "-" : "") + num.digits.text;
}
function formatVariable(exp) {
    var str = exp.name.text;
    if (exp.args) {
        str += "(";
        for (var args = exp.args; args; args = args.args) {
            var value = args.value;
            if (value instanceof Symbols.String) {
                str += value.text;
            }
            else if (value instanceof Symbols.Number) {
                str += formatNumber(value);
            }
            else if (value instanceof Symbols.True) {
                str += "true";
            }
            else if (value instanceof Symbols.False) {
                str += "false";
            }
            if (args.args) {
                str += ", ";
            }
        }
        str += ")";
    }
    if (exp.operator && exp.num) {
        var opStr = exp.operator instanceof Symbols.Minus ? " - " : " + ";
        str += opStr + formatNumber(exp.num);
    }
    return str;
}
function formatValue(_a, fields) {
    var value = _a.value;
    if (value instanceof Symbols.Number) {
        return formatNumber(value);
    }
    else if (value instanceof Symbols.String) {
        return value.text;
    }
    else if (value instanceof Symbols.DateTime) {
        return value.dateString.text;
    }
    else if (value instanceof Symbols.VariableExpression) {
        return formatVariable(value);
    }
    else if (value instanceof Symbols.True) {
        return "true";
    }
    else if (value instanceof Symbols.False) {
        return "false";
    }
    else if (value instanceof Symbols.Field) {
        return formatField(value, fields);
    }
    throw new Error("Format Error: Unkown value: " + value);
}
function formatValueList(valueList, fields) {
    var valueStrs = [];
    var currValueList = valueList;
    while (currValueList) {
        valueStrs.push(formatValue(currValueList.value, fields));
        currValueList = currValueList.restOfList;
    }
    return valueStrs.join(", ");
}
function formatConditionalOperator(cond) {
    if (cond instanceof Symbols.IsEmpty) {
        return "IS EMPTY";
    }
    else if (cond instanceof Symbols.IsNotEmpty) {
        return "IS NOT EMPTY";
    }
    else if (cond.conditionToken instanceof Symbols.Equals) {
        return "=";
    }
    else if (cond.conditionToken instanceof Symbols.NotEquals) {
        return "<>";
    }
    else if (cond.conditionToken instanceof Symbols.GreaterThan) {
        return ">";
    }
    else if (cond.conditionToken instanceof Symbols.GreaterOrEq) {
        return ">=";
    }
    else if (cond.conditionToken instanceof Symbols.LessThan) {
        return "<";
    }
    else if (cond.conditionToken instanceof Symbols.LessOrEq) {
        return "<=";
    }
    else if (cond.conditionToken instanceof Symbols.Contains) {
        return (cond.not ? "NOT " : "") + "CONTAINS";
    }
    else if (cond.conditionToken instanceof Symbols.ContainsWords) {
        return (cond.not ? "NOT " : "") + "CONTAINS WORDS";
    }
    else if (cond.conditionToken instanceof Symbols.InGroup) {
        return (cond.not ? "NOT " : "") + "IN GROUP";
    }
    else if (cond.conditionToken instanceof Symbols.Like) {
        return (cond.ever ? "EVER " : "") + (cond.not ? "NOT " : "") + "LIKE";
    }
    else if (cond.conditionToken instanceof Symbols.Under) {
        return (cond.ever ? "EVER " : "") + (cond.not ? "NOT " : "") + "UNDER";
    }
    else if (cond.conditionToken instanceof Symbols.Ever) {
        return "EVER";
    }
    throw new Error("Unexpected conditional operator");
}
function formatCondition(condition, tab, indent, fields) {
    if (condition.expression) {
        return __spreadArrays([
            tabs(tab, indent) + "("
        ], formatExpression(condition.expression, tab, indent + 1, fields), [
            tabs(tab, indent) + ")",
        ]);
    }
    var prefix = "";
    if (condition instanceof Symbols.LinkCondition) {
        if (condition.prefix instanceof Symbols.TargetPrefix) {
            prefix = "[Target].";
        }
        else if (condition.prefix instanceof Symbols.SourcePrefix) {
            prefix = "[Source].";
        }
    }
    if (condition.field && condition.valueList) {
        var op = condition.not ? " NOT IN " : " IN ";
        return [tabs(tab, indent) + prefix + formatField(condition.field, fields) + op + "(" + formatValueList(condition.valueList, fields) + ")"];
    }
    if (condition.field && condition.conditionalOperator) {
        var condStr = "" + tabs(tab, indent) + prefix + formatField(condition.field, fields) + " " + formatConditionalOperator(condition.conditionalOperator);
        if (condition.value) {
            condStr += " " + formatValue(condition.value, fields);
        }
        return [condStr];
    }
    return [];
}
function formatExpression(logicalExpression, tab, indent, fields) {
    var lines = formatCondition(logicalExpression.condition, tab, indent, fields);
    if (logicalExpression.everNot instanceof Symbols.Ever) {
        lines[0] = insert(lines[0], "EVER ");
    }
    else if (logicalExpression.everNot instanceof Symbols.Not) {
        lines[0] = insert(lines[0], "NOT ");
    }
    if (logicalExpression.orAnd && logicalExpression.expression) {
        var orAndStr = logicalExpression.orAnd instanceof Symbols.Or ? "OR " : "AND ";
        var secondExpLines = formatExpression(logicalExpression.expression, tab, indent, fields);
        secondExpLines[0] = insert(secondExpLines[0], orAndStr);
        lines.push.apply(lines, secondExpLines);
    }
    return lines;
}
function formatOrderByFieldList(orderBy, fields, tab) {
    var lines = [];
    var currOrderBy = orderBy;
    while (currOrderBy) {
        var field = formatField(currOrderBy.field, fields);
        var order = "";
        if (currOrderBy.ascDesc instanceof Symbols.Asc) {
            order = " ASC";
        }
        else if (currOrderBy.ascDesc instanceof Symbols.Desc) {
            order = " DESC";
        }
        var prefix = "";
        if (currOrderBy instanceof Symbols.LinkOrderByFieldList) {
            if (currOrderBy.prefix instanceof Symbols.Source) {
                prefix = "[Source].";
            }
            else if (currOrderBy.prefix instanceof Symbols.Target) {
                prefix = "[Target].";
            }
        }
        var line = prefix + field + order;
        if (currOrderBy === orderBy) {
            line = "ORDER BY " + line;
        }
        else {
            line = tab + line;
        }
        if (currOrderBy.restOfList) {
            line += ",";
        }
        lines.push(line);
        currOrderBy = currOrderBy.restOfList;
    }
    return lines;
}
function formatSelect(select, tab, fields) {
    var lines = [];
    lines.push("SELECT");
    lines.push.apply(lines, formatFieldList(select.fieldList, fields, tab));
    if (select instanceof Symbols.FlatSelect) {
        lines.push("FROM workitems");
    }
    else {
        lines.push("FROM workitemLinks");
    }
    if (select.whereExp) {
        lines.push("WHERE");
        lines.push.apply(lines, formatExpression(select.whereExp, tab, 1, fields));
    }
    if (select.orderBy) {
        lines.push.apply(lines, formatOrderByFieldList(select.orderBy, fields, tab));
    }
    if (select.asOf) {
        lines.push("ASOF " + select.asOf.dateString.text);
    }
    if (select instanceof Symbols.OneHopSelect && select.mode) {
        var modeStr = void 0;
        if (select.mode instanceof Symbols.MustContain) {
            modeStr = "MustContain";
        }
        else if (select.mode instanceof Symbols.MayContain) {
            modeStr = "MayContain";
        }
        else if (select.mode instanceof Symbols.DoesNotContain) {
            modeStr = "DoesNotContain";
        }
        else {
            throw new Error("Unknown mode");
        }
        lines.push("MODE (" + modeStr + ")");
    }
    if (select instanceof Symbols.RecursiveSelect) {
        var modes = [];
        if (select.recursive) {
            modes.push("Recursive");
        }
        if (select.matchingChildren) {
            modes.push("ReturnMatchingChildren");
        }
        if (modes.length > 0) {
            lines.push("MODE (" + modes.join(", ") + ")");
        }
    }
    lines.push("");
    return lines;
}
function formatSync(editor, fieldLookup) {
    var model = editor.getModel();
    var tab = model.getOneIndent();
    var parseTree = parse(model.getLinesContent());
    var lines;
    if (parseTree instanceof Symbols.FlatSelect ||
        parseTree instanceof Symbols.OneHopSelect ||
        parseTree instanceof Symbols.RecursiveSelect) {
        lines = formatSelect(parseTree, tab, fieldLookup);
    }
    else {
        // syntax error, not going to format
        return;
    }
    var edit = {
        text: lines.join("\r\n"),
        range: model.getFullModelRange(),
        forceMoveMarkers: true,
    };
    model.pushEditOperations(editor.getSelections(), [edit], 
    // TODO actually calculate the new position
    function () { return [new monaco.Selection(1, 1, 1, 1)]; });
}
export function format(editor) {
    return __awaiter(this, void 0, void 0, function () {
        var fields;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fieldsVal.isLoaded()) return [3 /*break*/, 2];
                    return [4 /*yield*/, fieldsVal.getValue()];
                case 1:
                    fields = _a.sent();
                    formatSync(editor, fields);
                    return [3 /*break*/, 3];
                case 2:
                    formatSync(editor, new FieldLookup([]));
                    // Queue fields get now;
                    fieldsVal.getValue();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=formatter.js.map