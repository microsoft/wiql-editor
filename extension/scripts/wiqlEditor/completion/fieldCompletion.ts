import { FieldType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

import { FieldLookup } from "../../cachedData/fields";
import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";
import * as monaco from "monaco-editor"
export function getStandardFieldCompletions(fields: FieldLookup, type: FieldType | null): monaco.languages.CompletionItem[] {
    const matchingFields = fields.values.filter((f) => type === null || type === f.type);
    return matchingFields.map((f) => {
        return {
            label: f.referenceName,
            kind: monaco.languages.CompletionItemKind.Variable,
        } as monaco.languages.CompletionItem;
    }).concat(matchingFields.map((f) => {
        return {
            label: f.name,
            kind: monaco.languages.CompletionItemKind.Variable,
        } as monaco.languages.CompletionItem;
    }));
}

export function getFieldCompletions(ctx: ICompletionContext): monaco.languages.CompletionItem[] {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0 && ctx.isFieldAllowed) {
        let fieldCompletions = getStandardFieldCompletions(ctx.fields, ctx.isInCondition ? ctx.fieldType : null);
        if (!(ctx.prevToken instanceof Symbols.LSqBracket)) {
            fieldCompletions = fieldCompletions.filter((s) => s.label.toString().indexOf(" ") < 0);
        }
        return fieldCompletions;
    }
    return [];
}
