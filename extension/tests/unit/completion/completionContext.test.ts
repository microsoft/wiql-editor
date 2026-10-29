import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import { ParseError } from "../../../scripts/wiqlEditor/compiler/parser";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { isInsideString, isInVariable } from "../../../scripts/wiqlEditor/completion/isIn";
import { completionContext } from "../../helpers/completion";
import { FieldLookup } from "../../../scripts/cachedData/fields";

const Q = "SELECT a FROM workitems WHERE ";

describe("createContext", () => {
    it("exposes the parse state and the last two parsed symbols", () => {
        const ctx = completionContext("SELECT a FROM workitems WHERE");
        expect(ctx.parseNext).toBeInstanceOf(ParseError);
        expect(ctx.parsedTokens).toBe(ctx.parseNext.parsedTokens);
        expect(ctx.prevToken).toBeInstanceOf(Symbols.Where);
        expect(ctx.prevToken2).toBeInstanceOf(Symbols.WorkItems);
    });

    it("has no field context before a field has been parsed", () => {
        const ctx = completionContext(Q);
        expect(ctx.fieldRefName).toBe("");
        expect(ctx.fieldType).toBeNull();
        expect(ctx.isInCondition).toBe(false);
        expect(ctx.isFieldAllowed).toBe(true);
    });

    it("captures the lower-cased field name and type once the operator is parsed", () => {
        const ctx = completionContext(Q + "[Story Points] > ");
        expect(ctx.fieldRefName).toBe("story points");
        expect(ctx.fieldType).toBe(FieldType.Double);
        expect(ctx.isInCondition).toBe(true);
    });

    it("keeps the field name for an unknown field but has no type", () => {
        const ctx = completionContext(Q + "nope = ");
        expect(ctx.fieldRefName).toBe("nope");
        expect(ctx.fieldType).toBeNull();
        expect(ctx.isFieldAllowed).toBe(true);
    });

    it("allows a field on the right-hand side only when the field type supports it", () => {
        expect(completionContext(Q + "Title = ").isFieldAllowed).toBe(true);
        expect(completionContext(Q + "Tags CONTAINS ").isFieldAllowed).toBe(false);
        expect(completionContext(Q + "[Area Path] = ").isFieldAllowed).toBe(false);
    });

    it("does not allow fields directly after GROUP", () => {
        expect(completionContext(Q + "Title IN GROUP ").isFieldAllowed).toBe(false);
    });

    it("parses lazily with string-assumption and caches the result", () => {
        const ctx = completionContext(Q + "Title = ");
        const first = ctx.getAssumedParse();
        expect(first).toBeInstanceOf(Symbols.FlatSelect);
        expect(ctx.getAssumedParse()).toBe(first);
    });

    it("works with an empty field set", () => {
        const ctx = completionContext(Q + "Title = ", new FieldLookup([]));
        expect(ctx.fieldType).toBeNull();
        expect(ctx.isFieldAllowed).toBe(true);
    });
});

describe("isInsideString", () => {
    it("is true while an unterminated string is being typed", () => {
        expect(isInsideString(completionContext(Q + "Title = @currentiteration('["))).toBe(true);
    });

    it("is false otherwise", () => {
        expect(isInsideString(completionContext(Q + "Title = "))).toBe(false);
        expect(isInsideString(completionContext("SELECT"))).toBe(false);
    });
});

describe("isInVariable", () => {
    it("returns null when no variable was parsed", () => {
        expect(isInVariable(completionContext(Q + "Title = "))).toBeNull();
    });

    it("returns the variable name without arguments when no parenthesis was opened", () => {
        const result = isInVariable(completionContext(Q + "Title = @today"))!;
        expect(result.name).toBe("@today");
        expect(result.args).toBeUndefined();
    });

    it("returns an empty argument list right after the opening parenthesis", () => {
        const result = isInVariable(completionContext(Q + "[Area Path] = @currentiteration("))!;
        expect(result.name).toBe("@currentiteration");
        expect(result.args).toEqual([]);
    });

    it("collects parsed arguments, skipping commas", () => {
        const result = isInVariable(completionContext(Q + "[Area Path] = @currentiteration('x',"))!;
        expect(result.args).toHaveLength(1);
        expect(result.args![0]).toBeInstanceOf(Symbols.String);
    });

    it("uses the last variable when several were parsed", () => {
        const ctx = completionContext(Q + "Title = @me AND [Area Path] = @currentiteration(");
        expect(isInVariable(ctx)!.name).toBe("@currentiteration");
    });
});
