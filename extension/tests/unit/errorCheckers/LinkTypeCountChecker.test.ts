import { LinkTypeCountChecker } from "../../../scripts/wiqlEditor/errorCheckers/LinkTypeCountChecker";
import { messages, parseQuery } from "../../helpers/fixtures";

const checker = new LinkTypeCountChecker();
const run = async (q: string) => messages(await checker.check(parseQuery(q)));

describe("LinkTypeCountChecker", () => {
    it("ignores flat queries", async () => {
        expect(await run("SELECT a FROM workitems WHERE a = 1")).toEqual([]);
    });

    it("ignores one-hop link queries", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Source].a = 1 MODE (MustContain)")).toEqual([]);
    });

    it("accepts a tree query with exactly one link type equality", async () => {
        expect(await run(
            "SELECT a FROM workitemLinks WHERE [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward' MODE (Recursive)",
        )).toEqual([]);
    });

    it("requires a link type in a tree query", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Source].a = 1 MODE (Recursive)"))
            .toEqual(["Tree query must contain at least 1 link type"]);
    });

    it("reports a single error covering both mode flags when no link type is present", async () => {
        const result = await checker.check(parseQuery(
            "SELECT a FROM workitemLinks WHERE [Source].a = 1 MODE (Recursive, ReturnMatchingChildren)",
        ));
        expect(messages(result)).toEqual(["Tree query must contain at least 1 link type"]);
        const { startColumn, endColumn } = (result[0] as any).range;
        expect(endColumn).toBeGreaterThan(startColumn);
    });

    it("flags every link type after the first", async () => {
        expect(await run(
            "SELECT a FROM workitemLinks WHERE [System.Links.LinkType] = 'x' AND [System.Links.LinkType] = 'y' AND [System.Links.LinkType] = 'z' MODE (Recursive)",
        )).toEqual(["Too many link types in tree query", "Too many link types in tree query"]);
    });

    it("matches the display name 'Link Type' too", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [Link Type] = 'x' MODE (Recursive)")).toEqual([]);
    });

    it("only allows equals for the link type", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [System.Links.LinkType] <> 'x' MODE (Recursive)"))
            .toEqual(["Only equals is valid for link type in tree queries"]);
        expect(await run("SELECT a FROM workitemLinks WHERE [System.Links.LinkType] IS EMPTY MODE (Recursive)"))
            .toEqual(["Only equals is valid for link type in tree queries"]);
    });

    it("rejects IN GROUP for the link type", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE [System.Links.LinkType] IN GROUP 'x' MODE (Recursive)"))
            .toEqual(["Only equals is valid for link type in tree queries"]);
    });

    it("reports nothing for syntax errors", async () => {
        expect(await run("SELECT a FROM workitemLinks WHERE")).toEqual([]);
    });
});
