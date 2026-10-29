import { ParseMode } from "../../../scripts/wiqlEditor/compiler/parser";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { symbolsAtPosition, symbolsOfType } from "../../../scripts/wiqlEditor/parseAnalysis/findSymbol";
import { parseQuery } from "../../helpers/fixtures";

describe("symbolsOfType", () => {
    it("finds all matching symbols in a full parse tree", () => {
        const tree = parseQuery("SELECT a, b FROM workitems WHERE a = 1 AND b = 2");
        expect(symbolsOfType(tree, Symbols.Field)).toHaveLength(4);
        expect(symbolsOfType(tree, Symbols.ConditionalExpression)).toHaveLength(2);
        expect(symbolsOfType(tree, Symbols.Equals)).toHaveLength(2);
    });

    it("includes the root itself when it matches", () => {
        const tree = parseQuery("SELECT a FROM workitems");
        expect(symbolsOfType(tree, Symbols.FlatSelect)).toEqual([tree]);
    });

    it("returns an empty array when nothing matches", () => {
        const tree = parseQuery("SELECT a FROM workitems");
        expect(symbolsOfType(tree, Symbols.Variable)).toEqual([]);
    });

    it("searches the partial symbols of a parse error", () => {
        const partial = parseQuery("SELECT a, b FROM workitems WHERE", ParseMode.Default);
        expect(symbolsOfType(partial, Symbols.Field)).toHaveLength(2);
        expect(symbolsOfType(partial, Symbols.Where)).toHaveLength(1);
    });

    it("matches subclasses through instanceof", () => {
        const tree = parseQuery("SELECT a FROM workitems WHERE a = 1");
        expect(symbolsOfType(tree, Symbols.Token).length).toBeGreaterThan(0);
        expect(symbolsOfType(tree, Symbols.SymbolTree).length).toBeGreaterThan(0);
    });
});

describe("symbolsAtPosition", () => {
    const query = "SELECT abc FROM workitems WHERE abc = 5";
    // columns (0-based):  SELECT=0-6, abc=7-10, FROM=11-15

    it("returns the token and its enclosing trees, innermost first", () => {
        const tree = parseQuery(query);
        const symbols = symbolsAtPosition(1, 8, tree);
        expect(symbols[0]).toBeInstanceOf(Symbols.Identifier);
        expect(symbols[0]).toHaveProperty("text", "abc");
        expect(symbols.some((s) => s instanceof Symbols.Field)).toBe(true);
        expect(symbols.some((s) => s instanceof Symbols.FieldList)).toBe(true);
        expect(symbols[symbols.length - 1]).toBeInstanceOf(Symbols.FlatSelect);
    });

    it("treats token end boundary as inclusive so the cursor right after a word still matches", () => {
        const tree = parseQuery(query);
        const symbols = symbolsAtPosition(1, 10, tree);
        expect(symbols[0]).toHaveProperty("text", "abc");
    });

    it("returns an empty array when no token covers the position", () => {
        const tree = parseQuery(query);
        expect(symbolsAtPosition(1, 500, tree)).toEqual([]);
        expect(symbolsAtPosition(7, 1, tree)).toEqual([]);
    });

    it("uses 1-based line numbers", () => {
        const tree = parseQuery("SELECT a\nFROM workitems");
        const symbols = symbolsAtPosition(2, 1, tree);
        expect(symbols[0]).toBeInstanceOf(Symbols.From);
    });

    it("works against the partial result of a parse error", () => {
        const partial = parseQuery("SELECT abc FROM");
        const symbols = symbolsAtPosition(1, 8, partial);
        expect(symbols[0]).toHaveProperty("text", "abc");
    });

    it("returns empty for a parse error that has no match", () => {
        const partial = parseQuery("SELECT abc FROM");
        expect(symbolsAtPosition(1, 300, partial)).toEqual([]);
    });
});
