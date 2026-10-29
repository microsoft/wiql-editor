import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import { FieldLookup } from "../../scripts/cachedData/fields";
import { IParseResults, parse, ParseError, ParseMode } from "../../scripts/wiqlEditor/compiler/parser";
import * as Symbols from "../../scripts/wiqlEditor/compiler/symbols";

export function field(name: string, referenceName: string, type: FieldType, extra: object = {}): any {
    return { name, referenceName, type, ...extra };
}

export function sampleFields(): any[] {
    return [
        field("ID", "System.Id", FieldType.Integer),
        field("Title", "System.Title", FieldType.String),
        field("State", "System.State", FieldType.String),
        field("Work Item Type", "System.WorkItemType", FieldType.String),
        field("Team Project", "System.TeamProject", FieldType.String),
        field("Assigned To", "System.AssignedTo", FieldType.String, { isIdentity: true }),
        field("Area Path", "System.AreaPath", FieldType.TreePath),
        field("Iteration Path", "System.IterationPath", FieldType.TreePath),
        field("Tags", "System.Tags", FieldType.PlainText),
        field("Description", "System.Description", FieldType.Html),
        field("History", "System.History", FieldType.History),
        field("Created Date", "System.CreatedDate", FieldType.DateTime),
        field("Story Points", "Microsoft.VSTS.Scheduling.StoryPoints", FieldType.Double),
        field("Is Blocked", "Custom.IsBlocked", FieldType.Boolean),
        field("Link Type", "System.Links.LinkType", FieldType.String),
    ];
}

export function sampleFieldLookup(): FieldLookup {
    return new FieldLookup(sampleFields());
}

export function parseQuery(query: string, mode = ParseMode.Default): IParseResults {
    return parse(query.split("\n"), mode);
}

/** Parses and asserts success, so tests can read tree properties without casts. */
export function parseOk<T extends Symbols.Symbol = any>(query: string): T {
    const result = parseQuery(query);
    if (result instanceof ParseError) {
        throw new Error(`Expected "${query}" to parse but got an error at ${result.errorToken.text}`);
    }
    return result as T;
}

/** Minimal stand-in for monaco.editor.ITextModel as used by the completion/format code. */
export function fakeModel(text: string, options = { insertSpaces: true, tabSize: 4 }) {
    const lines = text.split("\n");
    return {
        getLinesContent: () => lines,
        getValue: () => text,
        getOptions: () => options,
        getFullModelRange: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: lines.length, endColumn: lines[lines.length - 1].length + 1 }),
        pushEditOperations: jest.fn(),
    };
}

export function fakeEditor(text: string, options?: { insertSpaces: boolean, tabSize: number }) {
    const model = fakeModel(text, options);
    return {
        model,
        getModel: () => model,
        getValue: () => text,
        getSelections: () => [],
    } as any;
}

/** Hover messages of error-checker decorations. */
export function messages(decorations: any[]): string[] {
    return decorations.map((d) => d.options.hoverMessage.value);
}

/** Text of the first edit pushed to the model by format()/import. */
export function appliedText(model: { pushEditOperations: jest.Mock }): string {
    return model.pushEditOperations.mock.calls[0][1][0].text;
}
