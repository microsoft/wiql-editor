import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { parseOk } from "../../helpers/fixtures";

describe("getSymbolName", () => {
    it("returns the class name for tokens and tree symbols", () => {
        expect(Symbols.getSymbolName(Symbols.Select)).toBe("Select");
        expect(Symbols.getSymbolName(Symbols.FlatSelect)).toBe("FlatSelect");
        expect(Symbols.getSymbolName(Symbols.EOF)).toBe("EOF");
    });

    it("returns undefined for functions that are not ES5 class constructors", () => {
        expect(Symbols.getSymbolName(() => 1)).toBeUndefined();
    });

    it("logs and returns undefined when toString fails", () => {
        const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
        const bad: any = { toString: () => { throw new Error("boom"); } };
        expect(Symbols.getSymbolName(bad)).toBeUndefined();
        expect(log).toHaveBeenCalled();
        log.mockRestore();
    });
});

describe("isTokenClass", () => {
    it("is true for direct Token subclasses", () => {
        expect(Symbols.isTokenClass(Symbols.Select)).toBe(true);
        expect(Symbols.isTokenClass(Symbols.Identifier)).toBe(true);
    });

    it("is false for tree symbols", () => {
        expect(Symbols.isTokenClass(Symbols.FlatSelect)).toBe(false);
        expect(Symbols.isTokenClass(Symbols.Field)).toBe(false);
    });
});

describe("Token", () => {
    it("computes endColumn from startColumn and text length", () => {
        const t = new Symbols.Identifier(2, 5, "abc");
        expect([t.line, t.startColumn, t.endColumn, t.text]).toEqual([2, 5, 8, "abc"]);
    });

    it("EOF is an empty token that remembers the previous token", () => {
        const prev = new Symbols.Identifier(0, 0, "x");
        const eof = new Symbols.EOF(1, 4, prev);
        expect(eof.text).toBe("");
        expect(eof.endColumn).toBe(4);
        expect(eof.prev).toBe(prev);
    });
});

describe("SymbolTree auto-wiring", () => {
    it("wires FlatSelect components", () => {
        const select = parseOk<Symbols.FlatSelect>(
            "SELECT a, b FROM workitems WHERE a = 1 ORDER BY a DESC ASOF '2020-01-01'",
        );
        expect(select).toBeInstanceOf(Symbols.FlatSelect);
        expect(select.fieldList.field.identifier.text).toBe("a");
        expect(select.fieldList.restOfList!.field.identifier.text).toBe("b");
        expect(select.whereExp).toBeInstanceOf(Symbols.LogicalExpression);
        expect(select.orderBy!.ascDesc).toBeInstanceOf(Symbols.Desc);
        expect(select.asOf!.dateString.text).toBe("'2020-01-01'");
    });

    it("leaves optional components undefined/null when absent", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems");
        expect(select.whereExp).toBeFalsy();
        expect(select.orderBy).toBeFalsy();
        expect(select.asOf).toBeFalsy();
        expect(select.fieldList.restOfList).toBeFalsy();
    });

    it("wires negative numbers", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE a = -5");
        const num = select.whereExp!.condition.value!.value as Symbols.Number;
        expect(num).toBeInstanceOf(Symbols.Number);
        expect(num.minus).toBeInstanceOf(Symbols.Minus);
        expect(num.digits.text).toBe("5");
    });

    it("wires variable expressions with arguments and offsets", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE a = @today - 7");
        const variable = select.whereExp!.condition.value!.value as Symbols.VariableExpression;
        expect(variable.name.text).toBe("@today");
        expect(variable.operator).toBeInstanceOf(Symbols.Minus);
        expect(variable.num!.digits.text).toBe("7");

        const withArgs = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE a = @currentiteration('x', 1, true)");
        const v2 = withArgs.whereExp!.condition.value!.value as Symbols.VariableExpression;
        expect(v2.args!.value).toBeInstanceOf(Symbols.String);
        expect(v2.args!.args!.value).toBeInstanceOf(Symbols.Number);
        expect(v2.args!.args!.args!.value).toBeInstanceOf(Symbols.True);
    });

    it("wires IN value lists", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE a IN ('x', 'y')");
        const cond = select.whereExp!.condition;
        expect(cond.inOperator).toBeInstanceOf(Symbols.In);
        expect(cond.valueList!.value.value).toBeInstanceOf(Symbols.String);
        expect(cond.valueList!.restOfList!.value.value).toBeInstanceOf(Symbols.String);
    });

    it("wires link select prefixes, mode and recursion flags", () => {
        const oneHop = parseOk<Symbols.OneHopSelect>(
            "SELECT a FROM workitemLinks WHERE [Source].a = 1 ORDER BY [Target].b ASC MODE (MayContain)",
        );
        expect(oneHop).toBeInstanceOf(Symbols.OneHopSelect);
        expect(oneHop.whereExp!.condition.prefix).toBeInstanceOf(Symbols.SourcePrefix);
        expect(oneHop.orderBy!.prefix).toBeInstanceOf(Symbols.TargetPrefix);
        expect(oneHop.mode).toBeInstanceOf(Symbols.MayContain);

        const recursive = parseOk<Symbols.RecursiveSelect>(
            "SELECT a FROM workitemLinks WHERE [System.Links.LinkType] = 'x' MODE (Recursive, ReturnMatchingChildren)",
        );
        expect(recursive).toBeInstanceOf(Symbols.RecursiveSelect);
        expect(recursive.recursive).toBeInstanceOf(Symbols.Recursive);
        expect(recursive.matchingChildren).toBeInstanceOf(Symbols.ReturnMatchingChildren);
    });

    it("wires logical expression chaining", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE a = 1 OR b = 2");
        expect(select.whereExp!.orAnd).toBeInstanceOf(Symbols.Or);
        expect(select.whereExp!.expression!.condition.field!.identifier.text).toBe("b");
    });

    it("wires conditional operator modifiers", () => {
        const select = parseOk<Symbols.FlatSelect>("SELECT a FROM workitems WHERE a EVER NOT LIKE 'x'");
        const op = select.whereExp!.condition.conditionalOperator as Symbols.ConditionalOperator;
        expect(op.ever).toBeInstanceOf(Symbols.Ever);
        expect(op.not).toBeInstanceOf(Symbols.Not);
        expect(op.inputs.some((i) => i instanceof Symbols.Like)).toBe(true);
    });
});
