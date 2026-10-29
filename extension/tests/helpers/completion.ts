import { FieldLookup } from "../../scripts/cachedData/fields";
import { parse, ParseError, ParseMode } from "../../scripts/wiqlEditor/compiler/parser";
import { createContext } from "../../scripts/wiqlEditor/completion/completionContext";
import { fakeModel, sampleFieldLookup } from "./fixtures";

/** Builds the completion context for a cursor at the end of `query`. */
export function completionContext(query: string, fields: FieldLookup = sampleFieldLookup()) {
    const lines = query.split("\n");
    const parseNext = parse(lines, ParseMode.Suggest);
    if (!(parseNext instanceof ParseError)) {
        throw new Error("Expected a ParseError in suggest mode for: " + query);
    }
    return createContext(fakeModel(query) as any, parseNext, fields);
}

/** Cursor position at the end of `query`. */
export function endPosition(query: string) {
    const lines = query.split("\n");
    return { lineNumber: lines.length, column: lines[lines.length - 1].length + 1 } as any;
}

export const labels = (items: Array<{ label: any }>) => items.map((i) => String(i.label));
