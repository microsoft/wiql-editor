import { tokenize } from "../../../scripts/wiqlEditor/compiler/tokenizer";
import { wiqlPatterns } from "../../../scripts/wiqlEditor/compiler/tokenPatterns";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";

const lex = (...lines: string[]) => tokenize(lines, wiqlPatterns);
const summary = (tokens: Symbols.Token[]) => tokens.map((t) => [Symbols.getSymbolName(Object.getPrototypeOf(t).constructor), t.text]);

describe("tokenize", () => {
    it("returns no tokens for empty and whitespace-only input", () => {
        expect(lex("")).toEqual([]);
        expect(lex("  \t ")).toEqual([]);
        expect(lex()).toEqual([]);
    });

    it("recognises keywords case-insensitively and reports them with the pattern's canonical text", () => {
        const tokens = lex("SeLeCt From wHeRe");
        expect(summary(tokens)).toEqual([["Select", "SELECT"], ["From", "FROM"], ["Where", "WHERE"]]);
    });

    it("preserves the original casing for regex-matched tokens", () => {
        expect(summary(lex("MyField @CurrentIteration"))).toEqual([
            ["Identifier", "MyField"], ["Variable", "@CurrentIteration"],
        ]);
    });

    it("tokenizes multi-word keywords as single tokens", () => {
        expect(summary(lex("order by a is empty b is not empty"))).toEqual([
            ["OrderBy", "ORDER BY"],
            ["Identifier", "a"],
            ["IsEmpty", "IS EMPTY"],
            ["Identifier", "b"],
            ["IsNotEmpty", "IS NOT EMPTY"],
        ]);
    });

    it("only matches keywords on word boundaries", () => {
        // "selection" must not be split into SELECT + "ion"
        expect(summary(lex("selection inside orderly"))).toEqual([
            ["Identifier", "selection"],
            ["Identifier", "inside"],
            ["Identifier", "orderly"],
        ]);
    });

    it("maps all workitem aliases to the right token", () => {
        for (const word of ["issue", "issues", "workitem", "workitems"]) {
            expect(lex(word)[0]).toBeInstanceOf(Symbols.WorkItems);
        }
        for (const word of ["links", "workitemlinks"]) {
            expect(lex(word)[0]).toBeInstanceOf(Symbols.WorkItemLinks);
        }
    });

    it("tokenizes comparison operators, preferring the longest match", () => {
        expect(summary(lex("= <> >= <= > <"))).toEqual([
            ["Equals", "="],
            ["NotEquals", "<>"],
            ["GreaterOrEq", ">="],
            ["LessOrEq", "<="],
            ["GreaterThan", ">"],
            ["LessThan", "<"],
        ]);
    });

    it("tokenizes numbers including decimals and exponents", () => {
        expect(summary(lex("1 2.5 3. 1e5 1.5e-3"))).toEqual([
            ["Digits", "1"], ["Digits", "2.5"], ["Digits", "3."], ["Digits", "1e5"], ["Digits", "1.5e-3"],
        ]);
    });

    it("tokenizes quoted strings, including escaped quotes", () => {
        expect(summary(lex(`'it''s' "say ""hi"""`))).toEqual([
            ["String", "'it''s'"],
            ["String", `"say ""hi"""`],
        ]);
    });

    it("emits NonterminatingString for unclosed strings", () => {
        expect(summary(lex("'abc"))).toEqual([["NonterminatingString", "'abc"]]);
        expect(summary(lex(`"abc`))).toEqual([["NonterminatingString", `"abc`]]);
    });

    it("tokenizes bracketed identifiers, including spaces", () => {
        expect(summary(lex("[Work Item Type]"))).toEqual([
            ["LSqBracket", "["],
            ["Identifier", "Work Item Type"],
            ["RSqBracket", "]"],
        ]);
    });

    it("treats [Source] and [Target] as prefix tokens but not other brackets", () => {
        expect(summary(lex("[Source].[a] [target]"))).toEqual([
            ["LSqBracket", "["], ["Source", "Source"], ["RSqBracket", "]"],
            ["Dot", "."],
            ["LSqBracket", "["], ["Identifier", "a"], ["RSqBracket", "]"],
            ["LSqBracket", "["], ["Target", "target"], ["RSqBracket", "]"],
        ]);
    });

    it("treats [any] as a variable", () => {
        expect(summary(lex("[any]"))).toEqual([["Variable", "[any]"]]);
    });

    it("tokenizes @variables", () => {
        expect(summary(lex("@me @CurrentIteration @"))).toEqual([
            ["Variable", "@me"], ["Variable", "@CurrentIteration"], ["Variable", "@"],
        ]);
    });

    it("tokenizes dotted identifiers as one token", () => {
        expect(summary(lex("System.Title"))).toEqual([["Identifier", "System.Title"]]);
    });

    it("emits UnexpectedToken for unknown characters and continues", () => {
        expect(summary(lex("a ? b"))).toEqual([["Identifier", "a"], ["UnexpectedToken", "?"], ["Identifier", "b"]]);
    });

    it("records line and column positions across multiple lines", () => {
        const [select, id, from] = lex("SELECT", "  a", "FROM");
        expect([select.line, select.startColumn, select.endColumn]).toEqual([0, 0, 6]);
        expect([id.line, id.startColumn, id.endColumn]).toEqual([1, 2, 3]);
        expect([from.line, from.startColumn, from.endColumn]).toEqual([2, 0, 4]);
    });

    it("pops the bracket state so identifiers outside brackets tokenize normally", () => {
        expect(summary(lex("[a b] c d")).slice(3)).toEqual([["Identifier", "c"], ["Identifier", "d"]]);
    });
});
