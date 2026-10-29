import { ErrorChecker } from "../../scripts/wiqlEditor/errorCheckers/ErrorChecker";
import { installBackend } from "../helpers/fakeBackend";
import { messages, parseQuery } from "../helpers/fixtures";

jest.mock("../../scripts/RestCall", () => ({ callApi: jest.fn() }));

let backend: ReturnType<typeof installBackend>;
beforeAll(() => {
    backend = installBackend();
});

/** Runs the real parser and every real checker against the fake Azure DevOps backend. */
const check = async (query: string) => messages(await new ErrorChecker().check(parseQuery(query)));
const SELECT = "SELECT [System.Id] FROM workitems WHERE ";
const LINKS = "SELECT [System.Id] FROM workitemLinks WHERE ";

describe("valid queries produce no diagnostics", () => {
    it("accepts a typical backlog query", async () => {
        expect(await check(
            SELECT + "[System.TeamProject] = @project AND [System.WorkItemType] = 'Bug' AND [System.State] <> 'Closed' " +
            "AND [System.IterationPath] UNDER 'Alpha\\Sprint 1' AND [System.Tags] CONTAINS 'ui' " +
            "AND [System.AssignedTo] = @me ORDER BY [System.Id] DESC",
        )).toEqual([]);
    });

    it("accepts date arithmetic and team-scoped variables", async () => {
        expect(await check(
            SELECT + "[System.CreatedDate] >= @today - 30 AND [System.AreaPath] = @currentiteration('[Alpha]\\Web')",
        )).toEqual([]);
    });

    it("accepts display names, IN lists and groups", async () => {
        expect(await check(
            SELECT + "[Work Item Type] IN ('Bug', 'Task') AND [Title] IN GROUP 'x' AND [Story Points] > 3 AND [Is Blocked] = false",
        )).toEqual([]);
    });

    it("accepts one-hop and tree link queries", async () => {
        expect(await check(
            LINKS + "[Source].[System.State] = 'Active' AND [Target].[System.WorkItemType] = 'Bug' MODE (MustContain)",
        )).toEqual([]);
        expect(await check(
            LINKS + "[System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward' MODE (Recursive)",
        )).toEqual([]);
    });

    it("accepts the empty query", async () => {
        expect(await check("")).toEqual([]);
    });

    it("accepts tags from any project", async () => {
        expect(await check(SELECT + "[System.Tags] CONTAINS 'mobile'")).toEqual([]);
    });
});

describe("invalid queries are reported by the right checker", () => {
    it("reports an unknown field and an unknown variable", async () => {
        const result = await check("SELECT [System.Id], [Bogus] FROM workitems WHERE [System.State] = @nope");
        expect(result).toEqual([expect.stringMatching(/^Valid names are include/), "Field does not exist"]);
    });

    it("reports type mismatches", async () => {
        expect(await check(SELECT + "[System.Id] = 'x'")).toEqual(["Expected value of type Number"]);
        expect(await check(SELECT + "[System.Title] UNDER 'x'")).toEqual([expect.stringMatching(/^Valid comparisons are/)]);
        expect(await check(SELECT + "[Is Blocked] = 'yes'")).toEqual(["Expected value of type BOOLEAN"]);
    });

    it("reports values not present on the server", async () => {
        expect(await check(SELECT + "[System.IterationPath] = 'Gamma'")).toEqual(["Invalid Iteration Path value"]);
        expect(await check(SELECT + "[System.AreaPath] = 'Alpha\\Nowhere'")).toEqual(["Invalid Area Path value"]);
        expect(await check(SELECT + "[System.Tags] CONTAINS 'nope'")).toEqual(["Invalid Tags value"]);
    });

    it("reports unknown projects and teams in team variables", async () => {
        expect(await check(SELECT + "[System.AreaPath] = @currentiteration('[Nope]\\Web')"))
            .toEqual(["Project does not exist - expecting one of\n\n Alpha, Beta"]);
        expect(await check(SELECT + "[System.AreaPath] = @currentiteration('[Alpha]\\Missing')"))
            .toEqual(["Team does not exist - expecting one of\n\n Alpha Team, Web"]);
    });

    it("reports bad variable usage", async () => {
        expect(await check(SELECT + "[System.CreatedDate] = @today('x')")).toEqual(["@Today does not accept arguments"]);
        expect(await check(SELECT + "[System.Title] = @me + 1")).toEqual(["@me does not accept an offset"]);
    });

    it("reports link query mistakes", async () => {
        expect(await check(LINKS + "[System.State] = 'a' MODE (MustContain)")).toEqual(["Fields must be prefixed in link queries"]);
        expect(await check(LINKS + "[Source].[System.State] = 'a' MODE (Recursive)")).toEqual(["Tree query must contain at least 1 link type"]);
        expect(await check(LINKS + "[Link Type] = 'x' MODE (MustContain)")).toEqual(["Use reference name for link type"]);
    });

    it("reports every kind of problem in one pass, in checker order", async () => {
        const result = await check(
            "SELECT [System.Id], [Bogus] FROM workitems WHERE [System.Id] = 'x' AND [System.IterationPath] = 'Gamma' AND [System.State] = @nope",
        );
        expect(result).toEqual([
            expect.stringMatching(/^Valid names are include/),
            "Field does not exist",
            "Expected value of type Number",
            "Invalid Iteration Path value",
        ]);
    });
});

describe("syntax errors", () => {
    it("reports only the syntax error for an incomplete query", async () => {
        expect(await check(SELECT + "[System.Id] =")).toEqual([expect.stringMatching(/^Should be followed by one of \{.+\}$/)]);
    });

    it("points at the unexpected token", async () => {
        expect(await check("SELECT FROM workitems")).toEqual(["Expected one of {Identifier, LSqBracket}"]);
    });

    it("still reports unknown fields that were parsed before the error", async () => {
        const result = await check("SELECT [Bogus] FROM workitems WHERE");
        expect(result).toContain("Field does not exist");
        expect(result.some((m) => m.startsWith("Should be followed by"))).toBe(true);
    });
});

describe("backend usage", () => {
    it("loads each shared resource once regardless of how many checks run", async () => {
        await Promise.all([
            check(SELECT + "[System.IterationPath] = 'Alpha'"),
            check(SELECT + "[System.AreaPath] = 'Alpha'"),
            check(SELECT + "[System.Tags] CONTAINS 'ui'"),
            check(SELECT + "[System.Id] = 1"),
        ]);
        expect(backend.calls.getFields).toBe(1);
        expect(backend.calls.getProjects).toBe(1);
        expect(backend.calls.tagRequests.sort()).toEqual(["a-id", "b-id"]);
    });
});
