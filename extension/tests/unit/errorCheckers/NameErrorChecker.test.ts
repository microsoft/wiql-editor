import { fieldsVal } from "../../../scripts/cachedData/fields";
import { NameErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/NameErrorChecker";
import { messages, parseQuery, sampleFieldLookup } from "../../helpers/fixtures";

jest.mock("../../../scripts/cachedData/fields", () => ({
    __esModule: true,
    ...jest.requireActual("../../../scripts/cachedData/fields"),
    fieldsVal: { getValue: jest.fn(), isLoaded: jest.fn() },
}));

const getValue = fieldsVal.getValue as jest.Mock;
const run = async (q: string) => messages(await new NameErrorChecker().check(parseQuery(q)));

beforeEach(() => getValue.mockResolvedValue(sampleFieldLookup()));

describe("NameErrorChecker: fields", () => {
    it("accepts reference names and display names, ignoring case", async () => {
        expect(await run("SELECT [System.Id], [work item type], title FROM workitems WHERE state = 'x'")).toEqual([]);
    });

    it("flags unknown fields in every position", async () => {
        expect(await run("SELECT nope FROM workitems WHERE [Missing Field] = 'x' ORDER BY other"))
            .toEqual(["Field does not exist", "Field does not exist", "Field does not exist"]);
    });

    it("flags unknown fields used as the right-hand value", async () => {
        expect(await run("SELECT title FROM workitems WHERE title = nope")).toEqual(["Field does not exist"]);
    });

    it("loads the field list once per checker instance", async () => {
        const checker = new NameErrorChecker();
        await checker.check(parseQuery("SELECT title FROM workitems"));
        await checker.check(parseQuery("SELECT title FROM workitems"));
        expect(getValue).toHaveBeenCalledTimes(1);
    });

    it("also checks the identifiers that were parsed before a syntax error", async () => {
        expect(await run("SELECT title, nope FROM workitems WHERE")).toEqual(["Field does not exist"]);
    });
});

describe("NameErrorChecker: variables", () => {
    it("accepts defined variables regardless of case", async () => {
        expect(await run("SELECT title FROM workitems WHERE title = @ME AND [Assigned To] = @Project")).toEqual([]);
    });

    it("accepts [any]", async () => {
        expect(await run("SELECT title FROM workitems WHERE title = [any]")).toEqual([]);
    });

    it("lists the valid names for an unknown variable", async () => {
        const result = await run("SELECT title FROM workitems WHERE title = @unknown");
        expect(result).toHaveLength(1);
        expect(result[0]).toMatch(/^Valid names are include \{.*@me.*@today.*\}$/);
    });
});
