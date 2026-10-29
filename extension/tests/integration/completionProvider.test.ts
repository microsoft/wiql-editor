import { completionProvider } from "../../scripts/wiqlEditor/completion/completion";
import { installBackend } from "../helpers/fakeBackend";
import { fakeModel } from "../helpers/fixtures";

jest.mock("../../scripts/RestCall", () => ({ callApi: jest.fn() }));

beforeAll(() => {
    installBackend();
});

const WHERE = "SELECT [System.Id] FROM workitems WHERE ";

/** Cursor at the end of the text. */
async function suggest(text: string) {
    const lines = text.split("\n");
    return suggestAt(text, lines.length, lines[lines.length - 1].length + 1);
}

async function suggestAt(text: string, lineNumber: number, column: number) {
    const result: any = await completionProvider.provideCompletionItems(
        fakeModel(text) as any, { lineNumber, column } as any, undefined as any, undefined as any,
    );
    return result.suggestions as Array<{ label: string, insertText?: string }>;
}
const labelsOf = async (text: string) => (await suggest(text)).map((s) => s.label);

describe("completionProvider", () => {
    it("is triggered by the characters users type inside queries", () => {
        expect(completionProvider.triggerCharacters).toEqual([" ", "\t", "[", ".", "@", "\"", "'", "\\"]);
    });

    describe("keywords and structure", () => {
        it("starts with SELECT on an empty document", async () => {
            expect(await labelsOf("")).toEqual(["SELECT"]);
        });

        it("offers fields after SELECT", async () => {
            const result = await labelsOf("SELECT ");
            expect(result).toEqual(expect.arrayContaining(["[", "System.Title", "Title", "System.Id"]));
            expect(result).not.toContain("SELECT");
        });

        it("offers the two sources after FROM", async () => {
            expect(await labelsOf("SELECT [System.Id] FROM ")).toEqual(["workitems", "workitemlinks"]);
        });

        it("offers the clauses that can follow FROM", async () => {
            expect((await labelsOf("SELECT [System.Id] FROM workitems")).sort()).toEqual(["ASOF", "ORDER BY", "WHERE"]);
        });

        it("offers expression starters after WHERE", async () => {
            expect(await labelsOf(WHERE)).toEqual(expect.arrayContaining(["(", "[", "EVER", "NOT", "System.Title"]));
        });

        it("offers logical connectors after a complete condition", async () => {
            expect((await labelsOf(WHERE + "[System.Id] = 1 ")).sort()).toEqual(["AND", "ASOF", "OR", "ORDER BY"]);
        });

        it("offers sort directions after ORDER BY field", async () => {
            expect((await labelsOf(WHERE + "[System.Id] = 1 ORDER BY [System.Id] ")).sort()).toEqual([",", "ASC", "ASOF", "DESC"]);
        });

        it("completes at the cursor, ignoring text after it", async () => {
            const text = "SELECT [System.Id] FROM \nWHERE [System.Id] = 1";
            const result = await suggestAt(text, 1, "SELECT [System.Id] FROM ".length + 1);
            expect(result.map((s) => s.label)).toEqual(["workitems", "workitemlinks"]);
        });
    });

    describe("fields and operators", () => {
        it("offers fields while a name is being typed", async () => {
            expect(await labelsOf("SELECT ti")).toEqual(expect.arrayContaining(["Title", "System.Title"]));
        });

        it("offers only the operators valid for the field type", async () => {
            const result = await labelsOf(WHERE + "Custom.IsBlocked ");
            expect(result).toEqual(expect.arrayContaining(["=", "<>"]));
            expect(result).not.toContain("CONTAINS");
            expect(result).not.toContain("UNDER");
        });

        it("restricts right-hand fields to the same type as the compared field", async () => {
            const result = await labelsOf(WHERE + "[System.State] = ");
            expect(result).toEqual(expect.arrayContaining(["System.Title", "State"]));
            expect(result).not.toContain("System.Id");
        });
    });

    describe("variables", () => {
        it("offers variables matching the field type", async () => {
            expect(await labelsOf(WHERE + "[System.State] = ")).toEqual(expect.arrayContaining(["@me", "@project", "[any]"]));
            const dates = await labelsOf(WHERE + "[System.CreatedDate] = ");
            expect(dates).toContain("@today");
            expect(dates).not.toContain("@me");
        });

        it("completes a partially typed variable without repeating the @", async () => {
            const result = await suggest(WHERE + "[System.State] = @");
            expect(result.find((s) => s.label === "@me")!.insertText).toBe("me");
        });
    });

    describe("string values from the server", () => {
        it("completes team projects", async () => {
            expect(await labelsOf(WHERE + "[System.TeamProject] = '")).toEqual(["Alpha", "Beta"]);
        });

        it("keeps all candidates while a partial string without delimiters is typed", async () => {
            expect(await labelsOf(WHERE + "[System.TeamProject] = 'A")).toEqual(["Alpha", "Beta"]);
        });

        it("completes work item types across projects", async () => {
            expect((await labelsOf(WHERE + "[Work Item Type] = '")).sort()).toEqual(["Bug", "Epic", "Task"]);
        });

        it("completes work item type categories after GROUP", async () => {
            expect((await labelsOf(WHERE + "[System.WorkItemType] IN GROUP '")).sort()).toEqual([
                "Microsoft.BugCategory", "Microsoft.EpicCategory", "Microsoft.TaskCategory",
            ]);
        });

        it("completes iteration and area paths", async () => {
            expect((await labelsOf(WHERE + "[System.IterationPath] = '")).sort()).toEqual([
                "Alpha", "Alpha\\Sprint 1", "Alpha\\Sprint 2", "Beta", "Beta\\Release 1",
            ]);
            expect((await labelsOf(WHERE + "[System.AreaPath] UNDER '")).sort()).toEqual([
                "Alpha", "Alpha\\API", "Alpha\\Web", "Beta", "Beta\\Mobile",
            ]);
        });

        it("completes identities (teams and members)", async () => {
            const result = await labelsOf(WHERE + "[System.AssignedTo] = '");
            expect(result).toEqual(expect.arrayContaining([
                "Ada Lovelace <ada@example.com>",
                "Grace Hopper <grace@example.com>",
                "[Alpha]\\Web",
                "[Beta]\\Beta Team",
            ]));
        });

        it("completes tags for the current project", async () => {
            expect((await labelsOf(WHERE + "[System.Tags] CONTAINS '")).sort()).toEqual(["bug", "ui"]);
        });

        it("completes link types, excluding non-work-item relations", async () => {
            expect((await labelsOf(WHERE + "[System.Links.LinkType] = '")).sort()).toEqual([
                "System.LinkTypes.Hierarchy-Forward", "System.LinkTypes.Related",
            ]);
        });

        it("offers nothing for fields without server-side values", async () => {
            expect(await labelsOf(WHERE + "[System.Title] = '")).toEqual([]);
        });

        // Known bug: getStateCompletions returns work item type names when the query has no
        // project filter. Change to `it` once states are returned.
        it.failing("completes states", async () => {
            const result = await labelsOf(WHERE + "[System.State] = '");
            expect(result).toEqual(expect.arrayContaining(["New", "Active", "Done"]));
        });
    });

    describe("variable arguments", () => {
        it("completes [project] for team variables", async () => {
            expect(await labelsOf(WHERE + "[System.AreaPath] = @currentiteration('")).toEqual(["[Alpha]", "[Beta]"]);
        });

        it("completes team names once the project is typed", async () => {
            expect(await labelsOf(WHERE + "[System.AreaPath] = @currentiteration('[Alpha]\\")).toEqual(["Alpha Team", "Web"]);
            expect(await labelsOf(WHERE + "[System.AreaPath] = @teamareas('[beta]\\")).toEqual(["Beta Team"]);
        });

        it("offers nothing for an unknown project", async () => {
            expect(await labelsOf(WHERE + "[System.AreaPath] = @currentiteration('[Nope]\\")).toEqual([]);
        });
    });
});
