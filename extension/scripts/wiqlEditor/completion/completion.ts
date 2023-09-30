import { fieldsVal } from "../../cachedData/fields";
import { IParseResults, parse, ParseError, ParseMode } from "../compiler/parser";
import { createContext } from "./completionContext";
import { getFieldCompletions } from "./fieldCompletion";
import { getCurrentIdentifierCompletions } from "./identifierCompletion";
import { isInsideString } from "./isIn";
import { getKeywordCompletions } from "./keywordCompletion";
import { pushStringCompletions } from "./pushStringCompletions";
import { getStringValueCompletions } from "./valueCompletions";
import { getVariableParameterCompletions } from "./variableArgumentCompletion";
import { getCurrentVariableCompletions, getVariableCompletions } from "./variableCompletion";
import * as monaco from 'monaco-editor';

function parseFromPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position): IParseResults {
    const lines = model.getLinesContent().slice(0, position.lineNumber);
    if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
    }
    return parse(lines, ParseMode.Suggest);
}
async function provideCompletionItems(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
): Promise<monaco.languages.CompletionList> {
    const parseNext = parseFromPosition(model, position);
    if (!(parseNext instanceof ParseError) || parseNext.remainingTokens.length > 2) {
        // valid query, can't suggest
        return { suggestions: [] };
    }
    const ctx = createContext(model, parseNext, await fieldsVal.getValue());
    const completions: monaco.languages.CompletionItem[] = [
        ...await getCurrentIdentifierCompletions(ctx, position),
        ...await getCurrentVariableCompletions(ctx, position),
    ];
    if (completions.length > 0) {
        return { suggestions: completions };
    }
    // Don't symbols complete inside strings
    if (!isInsideString(ctx)) {
        completions.push(
            ...getKeywordCompletions(ctx),
            ...getFieldCompletions(ctx),
            ...getVariableCompletions(ctx),
        );
    }
    if (completions.length > 0) {
        return { suggestions: completions };
    }
    completions.push(...await getVariableParameterCompletions(ctx));
    if (completions.length > 0) {
        return { suggestions: completions };
    }
    // Field Values
    if (ctx.fieldRefName && ctx.isInCondition) {
        const values = await getStringValueCompletions(ctx);
        return { suggestions: pushStringCompletions(ctx, values, completions) };;
    }

    return { suggestions: completions };
}

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: [" ", "\t", "[", ".", "@", "\"", "'", "\\"],
    provideCompletionItems,
};
