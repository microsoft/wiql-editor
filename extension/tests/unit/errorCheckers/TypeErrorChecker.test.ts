import { fieldsVal } from "../../../scripts/cachedData/fields";
import { getFieldComparisonLookup, TypeErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/TypeErrorChecker";
import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { messages, parseQuery, sampleFieldLookup } from "../../helpers/fixtures";

jest.mock("../../../scripts/cachedData/fields", () => ({
    __esModule: true,
    ...jest.requireActual("../../../scripts/cachedData/fields"),
    fieldsVal: { getValue: jest.fn(), isLoaded: jest.fn() },
}));

const getValue = fieldsVal.getValue as jest.Mock;
const run = async (where: string) =>
    messages(await new TypeErrorChecker().check(parseQuery(`SELECT title FROM workitems WHERE ${where}`)));

beforeEach(() => getValue.mockResolvedValue(sampleFieldLookup()));

describe("TypeErrorChecker: string fields", () => {
    it("accepts valid comparisons", async () => {
        expect(await run("Title = 'x' AND Title <> 'y' AND Title > 'a' AND Title CONTAINS 'z'")).toEqual([]);
        expect(await run("Title IN GROUP 'g'")).toEqual([]);
        expect(await run("Title IN ('a', 'b')")).toEqual([]);
    });

    it("rejects a number where a string is expected", async () => {
        expect(await run("Title = 5")).toEqual(["Expected value of type String"]);
    });

    it("rejects operators that strings do not support", async () => {
        const [message] = await run("Title UNDER 'x'");
        expect(message).toMatch(/^Valid comparisons are Equals, NotEquals, .*Contains, InGroup$/);
    });

    it("rejects IS EMPTY (only html/plain text support it)", async () => {
        expect(await run("Title IS EMPTY")).toHaveLength(1);
    });

    it("rejects field references in value lists", async () => {
        expect(await run("Title IN (State, 'x')")).toEqual(["Values in list must be literals"]);
    });

    it("compares fields of the same type", async () => {
        expect(await run("Title = State")).toEqual([]);
    });

    it("rejects comparing against a field of another type", async () => {
        expect(await run("Title = [Created Date]")).toEqual(["Expected field of type String"]);
    });
});

describe("TypeErrorChecker: numeric fields", () => {
    it("accepts numbers, ranges and groups", async () => {
        expect(await run("ID = 5 AND ID >= 1 AND [Story Points] = 1.5 AND ID IN (1, 2) AND ID = -3")).toEqual([]);
    });

    it("rejects strings", async () => {
        expect(await run("ID = 'x'")).toEqual(["Expected value of type Number"]);
        expect(await run("ID IN (1, 'x')")).toEqual(["Expected value of type Number"]);
    });

    it("rejects field-to-field comparison with a different type", async () => {
        expect(await run("ID = [Story Points]")).toEqual(["Expected field of type Integer"]);
    });
});

describe("TypeErrorChecker: other field types", () => {
    it("restricts html fields to contains / empty checks", async () => {
        expect(await run("Description CONTAINS 'x'")).toEqual([]);
        expect(await run("Description IS NOT EMPTY")).toEqual([]);
        expect(await run("Description = 'x'")).toEqual([
            "Valid comparisons are Contains, ContainsWords, IsEmpty, IsNotEmpty",
        ]);
    });

    it("restricts history fields to contains", async () => {
        expect(await run("History CONTAINS WORDS 'x'")).toEqual([]);
        expect(await run("History IS EMPTY")).toEqual(["Valid comparisons are Contains, ContainsWords"]);
    });

    it("rejects group comparison on fields that do not support it", async () => {
        expect(await run("Tags IN ('a')")).toEqual(["Tags does not support group comparisons"]);
    });

    it("rejects field-to-field comparison where no field operation exists", async () => {
        expect(await run("Tags CONTAINS Title")).toEqual(["There is no valid operation for Tags and field"]);
        expect(await run("[Area Path] = Title")).toEqual(["There is no valid operation for Area Path and field"]);
    });

    it("tree paths support equals, not-equals and under", async () => {
        expect(await run("[Area Path] UNDER 'P' AND [Area Path] = 'P'")).toEqual([]);
        expect(await run("[Area Path] > 'P'")).toEqual(["Valid comparisons are Equals, NotEquals, Under"]);
    });

    it("booleans require true/false", async () => {
        expect(await run("[Is Blocked] = true AND [Is Blocked] <> false")).toEqual([]);
        expect(await run("[Is Blocked] = 'yes'")).toEqual(["Expected value of type BOOLEAN"]);
        expect(await run("[Is Blocked] > true")).toEqual(["Valid comparisons are Equals, NotEquals, Ever"]);
    });

    it("dates accept strings but not numbers", async () => {
        expect(await run("[Created Date] > '2020-01-01'")).toEqual([]);
        expect(await run("[Created Date] > 5")).toEqual(["Expected value of type String"]);
    });

    it("link type is limited to equals / not equals", async () => {
        expect(await run("[System.Links.LinkType] = 'x'")).toEqual([]);
        expect(await run("[System.Links.LinkType] > 'x'")).toEqual(["Valid comparisons are Equals, NotEquals"]);
    });

    it("skips unknown fields (reported by NameErrorChecker instead)", async () => {
        expect(await run("Nope = 5")).toEqual([]);
    });
});

describe("TypeErrorChecker: variables", () => {
    it("accepts a variable whose type category matches", async () => {
        expect(await run("[Assigned To] = @me")).toEqual([]);
        expect(await run("ID = @follows")).toEqual([]);
        expect(await run("[Area Path] = @currentiteration('[P]\\T')")).toEqual([]);
    });

    it("rejects a numeric variable for a string field and vice versa", async () => {
        expect(await run("Title = @follows")).toEqual(["Expected value of type String"]);
        expect(await run("ID = @me")).toEqual(["Expected value of type Number"]);
    });
});

describe("getFieldComparisonLookup", () => {
    it("indexes fields by lower-case name and reference name", () => {
        const lookup = getFieldComparisonLookup(sampleFieldLookup());
        expect(lookup["system.title"]).toBe(lookup["title"]);
        expect(lookup["system.id"].fieldType).toBe(FieldType.Integer);
        expect(lookup["work item type"]).toBeDefined();
    });

    it("exposes operator classes for each field type", () => {
        const lookup = getFieldComparisonLookup(sampleFieldLookup());
        expect(lookup["title"].literal).toContain(Symbols.Contains);
        expect(lookup["title"].group).toEqual([Symbols.In]);
        expect(lookup["is blocked"].group).toEqual([]);
    });

    it("caches the result per FieldLookup instance", () => {
        const fields = sampleFieldLookup();
        expect(getFieldComparisonLookup(fields)).toBe(getFieldComparisonLookup(fields));
        expect(getFieldComparisonLookup(sampleFieldLookup())).not.toBe(getFieldComparisonLookup(fields));
    });
});
