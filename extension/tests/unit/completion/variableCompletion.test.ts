import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import {
    getCurrentVariableCompletions,
    getStandardVariableCompletions,
    getVariableCompletions,
} from "../../../scripts/wiqlEditor/completion/variableCompletion";
import { completionContext, endPosition, labels } from "../../helpers/completion";

const Q = "SELECT a FROM workitems WHERE ";

describe("getStandardVariableCompletions", () => {
    it("lists every variable when no type is requested", () => {
        expect(labels(getStandardVariableCompletions(null))).toEqual(
            expect.arrayContaining(["@me", "@today", "@project", "@currentiteration", "@teamareas", "@follows", "[any]"]),
        );
    });

    it("limits the list to variables of the requested type", () => {
        expect(labels(getStandardVariableCompletions(FieldType.TreePath))).toEqual(["@currentiteration", "@teamareas"]);
        expect(labels(getStandardVariableCompletions(FieldType.DateTime))).toEqual(["@today"]);
        expect(labels(getStandardVariableCompletions(FieldType.String))).toEqual(["@me", "@project", "[any]"]);
    });

    it("returns nothing for types without variables", () => {
        expect(getStandardVariableCompletions(FieldType.Boolean)).toEqual([]);
    });

    it("marks completions as variables", () => {
        expect(getStandardVariableCompletions(null).every((c) => c.kind === 4)).toBe(true);
    });
});

describe("getVariableCompletions", () => {
    it("offers variables where a value is expected, filtered by the field type", () => {
        const ctx = completionContext(Q + "[Created Date] = ");
        expect(labels(getVariableCompletions(ctx))).toEqual(["@today"]);
    });

    it("offers every variable when the field type is unknown", () => {
        const ctx = completionContext(Q + "nope = ");
        expect(labels(getVariableCompletions(ctx))).toEqual(labels(getStandardVariableCompletions(null)));
    });

    it("offers nothing where a variable cannot appear", () => {
        expect(getVariableCompletions(completionContext("SELECT"))).toEqual([]);
    });

    it("offers nothing right after GROUP", () => {
        expect(getVariableCompletions(completionContext(Q + "Title IN GROUP "))).toEqual([]);
    });
});

describe("getCurrentVariableCompletions", () => {
    it("completes a variable being typed, without the leading @", async () => {
        const query = Q + "Title = @";
        const result = await getCurrentVariableCompletions(completionContext(query), endPosition(query));
        // the operator is already reduced at this point, so the field type is not applied
        expect(labels(result)).toEqual(labels(getStandardVariableCompletions(null)));
        expect(result.map((r) => r.insertText)).toEqual(
            labels(result).map((l) => l.replace("@", "")),
        );
        expect(result.map((r) => r.insertText)).toContain("me");
    });

    it("does nothing when the cursor is not directly after the variable", async () => {
        const query = Q + "Title = @";
        const position = { lineNumber: 1, column: query.length + 3 } as any;
        expect(await getCurrentVariableCompletions(completionContext(query), position)).toEqual([]);
    });

    it("does nothing when the previous token is not a variable", async () => {
        const query = Q + "Title = ";
        expect(await getCurrentVariableCompletions(completionContext(query), endPosition(query))).toEqual([]);
    });
});
