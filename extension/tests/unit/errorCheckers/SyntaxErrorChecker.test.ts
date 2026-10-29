import { ParseError } from "../../../scripts/wiqlEditor/compiler/parser";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { SyntaxErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/SyntaxErrorChecker";
import { messages, parseQuery } from "../../helpers/fixtures";

const checker = new SyntaxErrorChecker();
const range = (d: any) => [d.range.startLineNumber, d.range.startColumn, d.range.endLineNumber, d.range.endColumn];

describe("SyntaxErrorChecker", () => {
    it("reports nothing for a valid query", async () => {
        expect(await checker.check(parseQuery("SELECT a FROM workitems"))).toEqual([]);
    });

    it("reports nothing for an empty query", async () => {
        expect(await checker.check(parseQuery(""))).toEqual([]);
    });

    it("flags the last token when the query ends prematurely", async () => {
        const result = await checker.check(parseQuery("SELECT a FROM workitems WHERE"));
        expect(result).toHaveLength(1);
        expect(messages(result)[0]).toMatch(/^Should be followed by one of \{.*Identifier.*\}$/);
        // WHERE is at columns 24-29 (0-based); range runs to the end of the document
        expect(range(result[0])).toEqual([1, 25, Infinity, Infinity]);
    });

    it("uses the singular message when only one token is expected", async () => {
        const result = await checker.check(parseQuery("SELECT [a"));
        expect(messages(result)).toEqual(["Should be followed by RSqBracket"]);
    });

    it("flags the unexpected token itself when it is not EOF", async () => {
        const result = await checker.check(parseQuery("SELECT a FROM workitems WHERE a ever = 'x'"));
        expect(result).toHaveLength(1);
        expect(messages(result)[0]).toMatch(/^Expected one of \{.*Like.*\}$/);
        expect(range(result[0])[0]).toBe(1);
        expect(range(result[0])[1]).toBe(38);
    });

    it("uses the singular message for a single expected token", async () => {
        const token = new Symbols.Identifier(0, 3, "oops");
        const error = new ParseError(["Select"], token, [], []);
        expect(messages(await checker.check(error))).toEqual(["Expected Select"]);
    });
});
