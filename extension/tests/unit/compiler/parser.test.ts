import { parse, ParseError, ParseMode } from "../../../scripts/wiqlEditor/compiler/parser";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { parseOk, parseQuery } from "../../helpers/fixtures";

const nameOf = (s: object) => Symbols.getSymbolName(Object.getPrototypeOf(s).constructor);

function parseError(query: string | string[], mode = ParseMode.Default): ParseError {
    const result = parse(Array.isArray(query) ? query : query.split("\n"), mode);
    expect(result).toBeInstanceOf(ParseError);
    return result as ParseError;
}

describe("parse: valid queries", () => {
    it.each([
        ["flat select", "SELECT [System.Id] FROM workitems", Symbols.FlatSelect],
        ["flat select with issues alias", "SELECT a FROM issues", Symbols.FlatSelect],
        ["links select", "SELECT a FROM workitemLinks WHERE [Source].a = 1 MODE (MustContain)", Symbols.OneHopSelect],
        ["links select with DoesNotContain", "SELECT a FROM workitemLinks MODE (DoesNotContain)", Symbols.OneHopSelect],
        ["tree select", "SELECT a FROM workitemLinks WHERE [System.Links.LinkType] = 'x' MODE (Recursive)", Symbols.RecursiveSelect],
    ])("%s", (_name, query, expected) => {
        expect(parseQuery(query)).toBeInstanceOf(expected);
    });

    it.each([
        "SELECT a FROM workitems WHERE a = 'x'",
        "SELECT a FROM workitems WHERE a <> 'x'",
        "SELECT a FROM workitems WHERE a >= 1 AND a <= 5",
        "SELECT a FROM workitems WHERE a > 1 OR a < 5",
        "SELECT a FROM workitems WHERE a IN ('1', '2', '3')",
        "SELECT a FROM workitems WHERE a NOT IN ('1')",
        "SELECT a FROM workitems WHERE a IS EMPTY",
        "SELECT a FROM workitems WHERE a IS NOT EMPTY",
        "SELECT a FROM workitems WHERE a CONTAINS 'x'",
        "SELECT a FROM workitems WHERE a NOT CONTAINS 'x'",
        "SELECT a FROM workitems WHERE a CONTAINS WORDS 'x'",
        "SELECT a FROM workitems WHERE a IN GROUP 'x'",
        "SELECT a FROM workitems WHERE a NOT IN GROUP 'x'",
        "SELECT a FROM workitems WHERE a UNDER 'x'",
        "SELECT a FROM workitems WHERE a LIKE 'x'",
        "SELECT a FROM workitems WHERE a EVER NOT LIKE 'x'",
        "SELECT a FROM workitems WHERE EVER a = 'x'",
        "SELECT a FROM workitems WHERE NOT a = 'x'",
        "SELECT a FROM workitems WHERE a = b",
        "SELECT a FROM workitems WHERE a = true",
        "SELECT a FROM workitems WHERE a = false",
        "SELECT a FROM workitems WHERE a = -1.5",
        "SELECT a FROM workitems WHERE a = @today - 1",
        "SELECT a FROM workitems WHERE a = @me",
        "SELECT a FROM workitems WHERE a = [any]",
        "SELECT a FROM workitems WHERE (a = 1 OR b = 2) AND c = 3",
        "SELECT a FROM workitems WHERE ((a = 1))",
        "SELECT a FROM workitems ORDER BY a",
        "SELECT a, b FROM workitems ORDER BY a ASC, b DESC",
        "SELECT a FROM workitems ASOF '2020-01-01'",
        "SELECT [Work Item Type], [System.Id] FROM workitems",
    ])("accepts %s", (query) => {
        expect(parseQuery(query)).toBeInstanceOf(Symbols.FlatSelect);
    });

    it("parses queries spread over multiple lines", () => {
        expect(parseQuery("SELECT a\nFROM workitems\nWHERE a = 1")).toBeInstanceOf(Symbols.FlatSelect);
    });

    it("is case-insensitive for keywords", () => {
        expect(parseQuery("select a from WORKITEMS where a = 1 order by a")).toBeInstanceOf(Symbols.FlatSelect);
    });

    it("allows keywords to be used as identifiers where a field is expected", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT source, target FROM workitems");
        expect(select.fieldList.field.identifier.text.toLowerCase()).toBe("source");
        expect(select.fieldList.restOfList!.field.identifier.text.toLowerCase()).toBe("target");
    });

    it("converts the keyword token into an Identifier token", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT recursive FROM workitems");
        expect(select.fieldList.field.identifier).toBeInstanceOf(Symbols.Identifier);
    });
});

describe("parse: syntax errors", () => {
    it("fails on empty input and expects SELECT", () => {
        const error = parseError("");
        expect(error.expectedTokens).toEqual(["Select"]);
        expect(error.errorToken).toBeInstanceOf(Symbols.EOF);
        expect(error.parsedTokens).toEqual([]);
    });

    it("reports expected tokens when query ends early", () => {
        const error = parseError("SELECT");
        expect(error.expectedTokens).toEqual(["Identifier", "LSqBracket"]);
        expect(error.errorToken).toBeInstanceOf(Symbols.EOF);
        expect(error.parsedTokens.map(nameOf)).toEqual(["Select"]);
    });

    it("links the EOF token to the last real token", () => {
        const error = parseError("SELECT a FROM workitems WHERE");
        const eof = error.errorToken as Symbols.EOF;
        expect(eof.prev).toBeInstanceOf(Symbols.Where);
    });

    it("reports the offending token when it is unexpected", () => {
        const error = parseError("SELECT a FROM workitems WHERE a ever = 'x'");
        expect(error.errorToken).toBeInstanceOf(Symbols.Equals);
        expect(error.expectedTokens).toEqual(expect.arrayContaining(["Like", "Under", "Not"]));
    });

    it("exposes the still-unconsumed tokens", () => {
        const error = parseError("SELECT a FROM workitems WHERE a ever = 'x'");
        expect(error.remainingTokens.length).toBeGreaterThan(1);
    });

    it("fails on unexpected characters", () => {
        const error = parseError("SELECT a FROM workitems WHERE a ? 1");
        expect(error.errorToken).toBeInstanceOf(Symbols.UnexpectedToken);
    });

    it("fails on function-style calls that are not variables", () => {
        const error = parseError("SELECT a FROM workitems WHERE a = date('x')");
        expect(error.errorToken).toBeInstanceOf(Symbols.LParen);
    });

    it("fails when FROM is missing", () => {
        const error = parseError("SELECT a WHERE a = 1");
        expect(error.errorToken).toBeInstanceOf(Symbols.Where);
        expect(error.expectedTokens).toEqual(expect.arrayContaining(["Comma", "From"]));
    });

    it("does not treat a keyword as an identifier where no field is accepted", () => {
        // FROM is not valid in Select's field position here; only Identifier/[ are.
        const error = parseError("SELECT from FROM workitems");
        expect(error.errorToken).toBeInstanceOf(Symbols.From);
    });
});

describe("parse: modes", () => {
    it("Suggest mode turns a complete query into an error at EOF so completions can be offered", () => {
        const error = parseError("SELECT a FROM workitems", ParseMode.Suggest);
        expect(error.errorToken).toBeInstanceOf(Symbols.EOF);
        expect(error.expectedTokens).toEqual(expect.arrayContaining(["Where", "OrderBy", "Asof", "EOF"]));
    });

    it("Default mode accepts the same query", () => {
        expect(parseQuery("SELECT a FROM workitems")).toBeInstanceOf(Symbols.FlatSelect);
    });

    it("Suggest mode reports field operators after a field", () => {
        const error = parseError("SELECT a FROM workitems WHERE a", ParseMode.Suggest);
        expect(error.expectedTokens).toEqual(expect.arrayContaining(["Equals", "In", "IsEmpty", "Contains"]));
    });

    it("Suggest mode reports value tokens after an operator", () => {
        const error = parseError("SELECT a FROM workitems WHERE a = ", ParseMode.Suggest);
        expect(error.expectedTokens).toEqual(
            expect.arrayContaining(["String", "Digits", "Variable", "True", "False", "Identifier"]),
        );
    });

    it("Suggest mode keeps an unfinished string argument as the error token", () => {
        const error = parseError("SELECT a FROM workitems WHERE a = @currentiteration('[", ParseMode.Suggest);
        expect(error.errorToken).toBeInstanceOf(Symbols.NonterminatingString);
        expect(error.errorToken.text).toBe("'[");
    });

    it("AssumeString mode inserts an empty string where a value is missing", () => {
        const result = parse(["SELECT a FROM workitems WHERE a = "], ParseMode.AssumeString);
        expect(result).toBeInstanceOf(Symbols.FlatSelect);
    });

    it("AssumeString mode still reports real errors", () => {
        const result = parse(["SELECT a FROM"], ParseMode.AssumeString);
        expect(result).toBeInstanceOf(ParseError);
    });
});
