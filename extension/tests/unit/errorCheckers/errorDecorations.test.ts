import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { decorationFromString, decorationFromSym, rangeFromSymbol } from "../../../scripts/wiqlEditor/errorCheckers/errorDecorations";
import { parseOk } from "../../helpers/fixtures";

const range = (r: any) => [r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn];

describe("rangeFromSymbol", () => {
    it("converts a single token to a 1-based range", () => {
        const token = new Symbols.Identifier(0, 7, "abc");
        expect(range(rangeFromSymbol(token))).toEqual([1, 8, 1, 11]);
    });

    it("spans the tokens of a symbol tree", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE abc = 5");
        const condition = select.whereExp!.condition;
        // "abc = 5" occupies 0-based columns 30-37
        expect(range(rangeFromSymbol(condition))).toEqual([1, 31, 1, 38]);
    });

    it("spans multiple lines", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a\nFROM workitems\nWHERE a = 1");
        expect(range(rangeFromSymbol(select.whereExp!))).toEqual([3, 7, 3, 12]);
    });

    it("spans an array of symbols", () => {
        const a = new Symbols.Identifier(0, 2, "aa");
        const b = new Symbols.Identifier(0, 10, "bb");
        expect(range(rangeFromSymbol([a, b]))).toEqual([1, 3, 1, 13]);
    });

    it("throws when the symbol contains no tokens", () => {
        expect(() => rangeFromSymbol([])).toThrow(/Could not find token/);
    });
});

describe("decorationFromSym", () => {
    it("creates an error decoration by default", () => {
        const token = new Symbols.Identifier(0, 0, "abc");
        const decoration = decorationFromSym("bad", token);
        expect(decoration.options.hoverMessage).toEqual({ value: "bad" });
        expect(decoration.options.className).toBe("underline wiql-error");
        expect(decoration.options.linesDecorationsClassName).toBe("column-color wiql-error");
        expect(range(decoration.range)).toEqual([1, 1, 1, 4]);
    });

    it("supports warnings", () => {
        const decoration = decorationFromSym("careful", new Symbols.Identifier(0, 0, "x"), "warn");
        expect(decoration.options.className).toBe("underline wiql-warn");
        expect(decoration.options.linesDecorationsClassName).toBe("column-color wiql-warn");
    });
});

describe("decorationFromString", () => {
    it("targets a substring of a string token using offset and length", () => {
        const str = new Symbols.String(2, 10, "'[Proj]\\Team'");
        const decoration = decorationFromString("msg", str, 2, 4);
        expect(range(decoration.range)).toEqual([3, 13, 3, 17]);
        expect(decoration.options.hoverMessage).toEqual({ value: "msg" });
    });

    it("supports warning type", () => {
        const decoration = decorationFromString("msg", new Symbols.String(0, 0, "'x'"), 0, 1, "warn");
        expect(decoration.options.className).toContain("wiql-warn");
    });
});
