import { PrefixChecker } from "../../../scripts/wiqlEditor/errorCheckers/PrefixChecker";
import { messages, parseQuery } from "../../helpers/fixtures";

const checker = new PrefixChecker();
const run = async (q: string) => messages(await checker.check(parseQuery(q)));

describe("PrefixChecker", () => {
    it("does not apply to flat queries", async () => {
        expect(await run("SELECT a FROM workitems WHERE a = 1")).toEqual([]);
    });

    it("accepts prefixed fields in link queries", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Source].a = 1 AND [Target].b = 2 MODE (MustContain)")).toEqual([]);
    });

    it("requires fields to be prefixed", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE a = 1 MODE (MustContain)"))
            .toEqual(["Fields must be prefixed in link queries"]);
    });

    it("asks for the reference name of the link type", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Link Type] = 'x' MODE (MustContain)"))
            .toEqual(["Use reference name for link type"]);
    });

    it("accepts an unprefixed link type reference name", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [System.Links.LinkType] = 'x' MODE (MustContain)")).toEqual([]);
    });

    it("rejects a prefixed link type", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Source].[System.Links.LinkType] = 'x' MODE (MustContain)"))
            .toEqual(["Link type cannot be prefixed"]);
    });

    it("allows different prefixes across top-level conditions", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Source].a = 1 OR [Target].b = 2 MODE (MustContain)")).toEqual([]);
    });

    it("requires a single prefix inside a parenthesised group (Source first)", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE ([Source].a = 1 OR [Target].b = 2) MODE (MustContain)"))
            .toEqual(["Expected Source prefix"]);
    });

    it("requires a single prefix inside a parenthesised group (Target first)", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE ([Target].a = 1 OR [Source].b = 2) MODE (MustContain)"))
            .toEqual(["Expected target prefix"]);
    });

    it("accepts a parenthesised group with a consistent prefix", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE ([Source].a = 1 OR [Source].b = 2) MODE (MustContain)")).toEqual([]);
    });
});
