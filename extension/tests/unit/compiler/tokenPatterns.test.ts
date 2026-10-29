import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { validIdentifier, wiqlPatterns } from "../../../scripts/wiqlEditor/compiler/tokenPatterns";

describe("validIdentifier", () => {
    const tok = (text: string) => new Symbols.Select(0, 0, text);

    it("accepts keyword-like and plain words", () => {
        expect(validIdentifier(tok("select"))).toBe(true);
        expect(validIdentifier(tok("_private"))).toBe(true);
        expect(validIdentifier(tok("System.Title"))).toBe(true);
    });

    it("rejects tokens with no identifier characters", () => {
        expect(validIdentifier(tok("="))).toBe(false);
        expect(validIdentifier(tok("123"))).toBe(false);
    });

    it("rejects missing tokens or empty text", () => {
        expect(validIdentifier(undefined as any)).toBe(false);
        expect(validIdentifier(tok(""))).toBe(false);
    });
});

describe("wiqlPatterns", () => {
    it("ends with a catch-all so tokenizing always makes progress", () => {
        const last = wiqlPatterns[wiqlPatterns.length - 1];
        expect(last.token).toBe(Symbols.UnexpectedToken);
        expect((last.match as RegExp).test("x")).toBe(true);
    });

    it("annotates boolean and numeric tokens with the value types they apply to", () => {
        const byToken = (t: Function) => wiqlPatterns.find((p) => p.token === t)!;
        expect(byToken(Symbols.True).valueTypes).toBeDefined();
        expect(byToken(Symbols.False).valueTypes).toBeDefined();
        expect(byToken(Symbols.Plus).valueTypes).toHaveLength(2);
        expect(byToken(Symbols.Minus).valueTypes).toHaveLength(2);
    });
});
