import { getKeywordCompletions } from "../../../scripts/wiqlEditor/completion/keywordCompletion";
import { completionContext, labels } from "../../helpers/completion";

const Q = "SELECT a FROM workitems WHERE ";
const kw = (query: string) => labels(getKeywordCompletions(completionContext(query)));

describe("getKeywordCompletions", () => {
    it("starts with SELECT", () => {
        expect(kw("")).toEqual(["SELECT"]);
    });

    it("offers the clause keywords after FROM workitems", () => {
        expect(kw("SELECT a FROM workitems ").sort()).toEqual(["ASOF", "ORDER BY", "WHERE"]);
    });

    it("offers the source tables after FROM", () => {
        expect(kw("SELECT a FROM ")).toEqual(expect.arrayContaining(["workitems", "workitemlinks"]));
    });

    it("offers and/or/order by after a complete condition", () => {
        expect(kw(Q + "Title = 'x' ")).toEqual(expect.arrayContaining(["AND", "OR", "ORDER BY", "ASOF"]));
    });

    it("never offers keywords that have their own completion logic", () => {
        const result = kw(Q + "Title = ");
        expect(result).not.toContain("@");
        expect(result.every((l) => typeof l === "string")).toBe(true);
    });

    it("does not offer field brackets where fields are not allowed", () => {
        expect(kw(Q + "[Area Path] = ")).not.toContain("[");
    });

    it("offers field brackets where a field comparison is allowed", () => {
        expect(kw(Q + "Title = ")).toContain("[");
    });

    describe("operators are filtered by the field type (for identifiers typed without brackets)", () => {
        it("string fields offer text operators", () => {
            const result = kw(Q + "Title");
            expect(result).toEqual(expect.arrayContaining(["=", "<>", "CONTAINS", "IN"]));
            expect(result).not.toContain("UNDER");
        });

        it("boolean fields only offer equality operators", () => {
            const result = kw(Q + "Custom.IsBlocked");
            expect(result).toEqual(expect.arrayContaining(["=", "<>", "EVER"]));
            for (const excluded of ["CONTAINS", "IN", "UNDER", "LIKE", "<", ">", "IS EMPTY"]) {
                expect(result).not.toContain(excluded);
            }
        });

        it("tree path fields offer UNDER but not text operators", () => {
            const result = kw(Q + "System.AreaPath");
            expect(result).toContain("UNDER");
            expect(result).not.toContain("CONTAINS");
        });

        it("numeric fields do not offer text operators", () => {
            const result = kw(Q + "Microsoft.VSTS.Scheduling.StoryPoints");
            expect(result).not.toContain("CONTAINS");
            expect(result).not.toContain("LIKE");
            expect(result).toContain(">=");
        });

        it("html fields offer IS EMPTY", () => {
            expect(kw(Q + "Description")).toEqual(expect.arrayContaining(["IS EMPTY", "IS NOT EMPTY", "CONTAINS"]));
        });

        it("does not filter after a bracketed field because the field is not reduced yet", () => {
            expect(kw(Q + "[Is Blocked]")).toContain("CONTAINS");
        });

        it("is case-insensitive", () => {
            expect(kw(Q + "title")).toContain("CONTAINS");
            expect(kw(Q + "id")).not.toContain("CONTAINS");
        });
    });

    describe("value keywords are filtered by the field type", () => {
        it("offers true/false for boolean fields", () => {
            expect(kw(Q + "[Is Blocked] = ")).toEqual(expect.arrayContaining(["true", "false"]));
        });

        it("does not offer true/false for other field types", () => {
            const result = kw(Q + "Title = ");
            expect(result).not.toContain("true");
            expect(result).not.toContain("false");
        });
    });

    describe("variable context", () => {
        it("does not offer opening parentheses after variables that take no arguments", () => {
            expect(kw(Q + "[Created Date] = @today")).not.toContain("(");
            expect(kw(Q + "Title = @me")).not.toContain("(");
        });

        it("offers an opening parenthesis after variables that take arguments", () => {
            expect(kw(Q + "[Area Path] = @currentiteration")).toContain("(");
            expect(kw(Q + "[Area Path] = @teamareas")).toContain("(");
        });

        it("does not offer +/- after variables that do not support offsets", () => {
            const result = kw(Q + "ID = @follows");
            expect(result).not.toContain("+");
            expect(result).not.toContain("-");
        });
    });
});
