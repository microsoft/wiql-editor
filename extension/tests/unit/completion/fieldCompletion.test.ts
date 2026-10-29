import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import { getFieldCompletions, getStandardFieldCompletions } from "../../../scripts/wiqlEditor/completion/fieldCompletion";
import { getCurrentIdentifierCompletions } from "../../../scripts/wiqlEditor/completion/identifierCompletion";
import { completionContext, endPosition, labels } from "../../helpers/completion";
import { sampleFieldLookup } from "../../helpers/fixtures";

const Q = "SELECT a FROM workitems WHERE ";
const fields = sampleFieldLookup();

describe("getStandardFieldCompletions", () => {
    it("offers both reference and display names for every field", () => {
        const result = labels(getStandardFieldCompletions(fields, null));
        expect(result).toHaveLength(fields.values.length * 2);
        expect(result).toEqual(expect.arrayContaining(["System.Title", "Title", "Work Item Type", "System.WorkItemType"]));
    });

    it("limits to the requested field type", () => {
        const result = labels(getStandardFieldCompletions(fields, FieldType.Integer));
        expect(result.sort()).toEqual(["ID", "System.Id"]);
    });

    it("returns nothing for a type without fields", () => {
        expect(getStandardFieldCompletions(fields, FieldType.Guid)).toEqual([]);
    });

    it("marks completions as variables", () => {
        expect(getStandardFieldCompletions(fields, null).every((c) => c.kind === 4)).toBe(true);
    });
});

describe("getFieldCompletions", () => {
    it("offers single-word fields where a field is expected", () => {
        const result = labels(getFieldCompletions(completionContext("SELECT ")));
        expect(result).toEqual(expect.arrayContaining(["System.Title", "Title", "ID"]));
        expect(result.every((l) => l.indexOf(" ") < 0)).toBe(true);
    });

    it("also offers names with spaces inside square brackets", () => {
        const result = labels(getFieldCompletions(completionContext("SELECT [")));
        expect(result).toContain("Work Item Type");
        expect(result).toContain("Created Date");
    });

    it("restricts the right-hand-side field to the compared field's type", () => {
        const result = labels(getFieldCompletions(completionContext(Q + "Title = ")));
        expect(result).toContain("System.State");
        expect(result).not.toContain("System.Id");
    });

    it("offers nothing when a field cannot appear", () => {
        expect(getFieldCompletions(completionContext("SELECT a FROM workitems "))).toEqual([]);
    });

    it("offers nothing on the right-hand side when the field type does not allow field comparison", () => {
        expect(getFieldCompletions(completionContext(Q + "[Area Path] = "))).toEqual([]);
    });
});

describe("getCurrentIdentifierCompletions", () => {
    it("offers all fields while a name is being typed", async () => {
        const query = "SELECT ti";
        const result = labels(await getCurrentIdentifierCompletions(completionContext(query), endPosition(query)));
        expect(result).toEqual(expect.arrayContaining(["Title", "System.Title"]));
        expect(result).not.toContain("Work Item Type");
    });

    it("narrows to the typed dotted prefix and inserts only the remainder", async () => {
        const query = "SELECT System.";
        const result = await getCurrentIdentifierCompletions(completionContext(query), endPosition(query));
        expect(labels(result)).toContain("System.Title");
        expect(labels(result).every((l) => l.toLowerCase().indexOf("system.") === 0)).toBe(true);
        expect(result.find((r) => r.label === "System.Title")!.insertText).toBe("Title");
    });

    it("handles display names with spaces inside brackets", async () => {
        const query = "SELECT [Work I";
        const result = await getCurrentIdentifierCompletions(completionContext(query), endPosition(query));
        expect(labels(result)).toEqual(["Work Item Type"]);
        expect(result[0].insertText).toBe("Item Type");
    });

    it("also completes identifiers typed on the right-hand side", async () => {
        const query = Q + "Title = st";
        const result = labels(await getCurrentIdentifierCompletions(completionContext(query), endPosition(query)));
        expect(result).toContain("State");
    });

    it("does nothing when the cursor has moved away from the identifier", async () => {
        const query = "SELECT ti";
        const position = { lineNumber: 1, column: query.length + 5 } as any;
        expect(await getCurrentIdentifierCompletions(completionContext(query), position)).toEqual([]);
    });

    it("does nothing when the previous token is not an identifier", async () => {
        const query = "SELECT ";
        expect(await getCurrentIdentifierCompletions(completionContext(query), endPosition(query))).toEqual([]);
    });

    it("does nothing when a field is not allowed at this position", async () => {
        const query = "SELECT ti";
        const ctx = { ...completionContext(query), isFieldAllowed: false };
        expect(await getCurrentIdentifierCompletions(ctx, endPosition(query))).toEqual([]);
    });
});
