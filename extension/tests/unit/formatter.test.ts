import { fieldsVal } from "../../scripts/cachedData/fields";
import { format } from "../../scripts/wiqlEditor/formatter";
import { appliedText, fakeEditor, sampleFieldLookup } from "../helpers/fixtures";

jest.mock("../../scripts/cachedData/fields", () => ({
    __esModule: true,
    ...jest.requireActual("../../scripts/cachedData/fields"),
    fieldsVal: { getValue: jest.fn(), isLoaded: jest.fn() },
}));

const T = "\t";
const tabs = { insertSpaces: false, tabSize: 4 };

async function formatted(query: string, options = tabs) {
    const editor = fakeEditor(query, options);
    await format(editor);
    return editor.model.pushEditOperations.mock.calls.length ? appliedText(editor.model) : null;
}
const lines = (...l: string[]) => l.join("\r\n");

beforeEach(() => {
    (fieldsVal.isLoaded as jest.Mock).mockReturnValue(true);
    (fieldsVal.getValue as jest.Mock).mockResolvedValue(sampleFieldLookup());
});

describe("format: structure", () => {
    it("puts each clause on its own line and ends with a newline", async () => {
        expect(await formatted("select id, title from workitems")).toBe(lines(
            "SELECT",
            `${T}[System.Id],`,
            `${T}[System.Title]`,
            "FROM workitems",
            "",
        ));
    });

    it("normalises display names to reference names", async () => {
        expect(await formatted("select [work item type] from workitems")).toBe(lines(
            "SELECT", `${T}[System.WorkItemType]`, "FROM workitems", "",
        ));
    });

    it("keeps unknown fields as written", async () => {
        expect(await formatted("select [Not A Field] from workitems")).toBe(lines(
            "SELECT", `${T}[Not A Field]`, "FROM workitems", "",
        ));
    });

    it("formats where, order by and asof", async () => {
        const result = await formatted(
            "select id from workitems where state = 'Active' and title contains 'x' order by id asc, title desc asof '2020-01-01'",
        );
        expect(result).toBe(lines(
            "SELECT",
            `${T}[System.Id]`,
            "FROM workitems",
            "WHERE",
            `${T}[System.State] = 'Active'`,
            `${T}AND [System.Title] CONTAINS 'x'`,
            "ORDER BY [System.Id] ASC,",
            `${T}[System.Title] DESC`,
            "ASOF '2020-01-01'",
            "",
        ));
    });

    it("omits ASC/DESC when not specified", async () => {
        expect(await formatted("select id from workitems order by id")).toContain("ORDER BY [System.Id]\r\n");
    });

    it("indents parenthesised groups", async () => {
        const result = await formatted("select id from workitems where (state = 'a' or state = 'b') and id = 1");
        expect(result).toBe(lines(
            "SELECT",
            `${T}[System.Id]`,
            "FROM workitems",
            "WHERE",
            `${T}(`,
            `${T}${T}[System.State] = 'a'`,
            `${T}${T}OR [System.State] = 'b'`,
            `${T})`,
            `${T}AND [System.Id] = 1`,
            "",
        ));
    });

    it("formats multi-line input the same as single-line input", async () => {
        const a = await formatted("select id\nfrom workitems\nwhere id = 1");
        const b = await formatted("select id from workitems where id = 1");
        expect(a).toBe(b);
    });

    it("is idempotent", async () => {
        const once = (await formatted("select id,title from workitems where state='a' or id in (1,2) order by id"))!;
        const twice = await formatted(once.replace(/\r\n/g, "\n"));
        expect(twice).toBe(once);
    });
});

describe("format: conditions", () => {
    const where = async (condition: string) => {
        const result = (await formatted(`select id from workitems where ${condition}`))!;
        return result.split("\r\n")[4].trim();
    };

    it.each([
        ["id = 1", "[System.Id] = 1"],
        ["id <> 1", "[System.Id] <> 1"],
        ["id > 1", "[System.Id] > 1"],
        ["id >= 1", "[System.Id] >= 1"],
        ["id < 1", "[System.Id] < 1"],
        ["id <= 1", "[System.Id] <= 1"],
        ["id = -5", "[System.Id] = -5"],
        ["[Story Points] = 1.5", "[Microsoft.VSTS.Scheduling.StoryPoints] = 1.5"],
        ["title contains 'x'", "[System.Title] CONTAINS 'x'"],
        ["title not contains 'x'", "[System.Title] NOT CONTAINS 'x'"],
        ["description contains words 'x'", "[System.Description] CONTAINS WORDS 'x'"],
        ["description not contains words 'x'", "[System.Description] NOT CONTAINS WORDS 'x'"],
        ["title in group 'g'", "[System.Title] IN GROUP 'g'"],
        ["title not in group 'g'", "[System.Title] NOT IN GROUP 'g'"],
        ["title is empty", "[System.Title] IS EMPTY"],
        ["title is not empty", "[System.Title] IS NOT EMPTY"],
        ["title in ('a', 'b')", "[System.Title] IN ('a', 'b')"],
        ["title not in ('a')", "[System.Title] NOT IN ('a')"],
        ["title = state", "[System.Title] = [System.State]"],
        ["[Is Blocked] = true", "[Custom.IsBlocked] = true"],
        ["[Is Blocked] = FALSE", "[Custom.IsBlocked] = false"],
        ["[Area Path] under 'P'", "[System.AreaPath] UNDER 'P'"],
        ["title like 'x'", "[System.Title] LIKE 'x'"],
        ["[Created Date] > '2020-01-01'", "[System.CreatedDate] > '2020-01-01'"],
    ])("%s", async (input, expected) => {
        expect(await where(input)).toBe(expected);
    });

    // Known bug: ConditionalOperator.conditionToken resolves to the Ever token first, so the
    // formatter prints "EVER 'x'" and drops LIKE/UNDER. Change to `it` once fixed.
    it.failing("keeps LIKE/UNDER after EVER", async () => {
        expect(await where("title ever like 'x'")).toBe("[System.Title] EVER LIKE 'x'");
        expect(await where("title ever not under 'x'")).toBe("[System.Title] EVER NOT UNDER 'x'");
    });

    it("formats leading EVER and NOT on a condition", async () => {
        expect(await where("ever title = 'x'")).toBe("EVER [System.Title] = 'x'");
        expect(await where("not title = 'x'")).toBe("NOT [System.Title] = 'x'");
    });

    describe("variables", () => {
        it("keeps simple variables as written", async () => {
            expect(await where("title = @me")).toBe("[System.Title] = @me");
        });

        it("spaces offsets", async () => {
            expect(await where("[Created Date] = @today-7")).toBe("[System.CreatedDate] = @today - 7");
            expect(await where("[Created Date] = @today+7")).toBe("[System.CreatedDate] = @today + 7");
        });

        it("formats arguments separated by commas", async () => {
            expect(await where("[Area Path] = @currentiteration('[P]\\T')")).toBe("[System.AreaPath] = @currentiteration('[P]\\T')");
            expect(await where("[Area Path] = @currentiteration('a',1,true,false)"))
                .toBe("[System.AreaPath] = @currentiteration('a', 1, true, false)");
        });

        it("formats negative number arguments", async () => {
            expect(await where("[Area Path] = @currentiteration(-1)")).toBe("[System.AreaPath] = @currentiteration(-1)");
        });
    });
});

describe("format: link queries", () => {
    it("formats a one-hop query with prefixes and mode", async () => {
        const result = await formatted(
            "select id from workitemlinks where [source].id = 1 and [target].state = 'x' mode (mustcontain)",
        );
        expect(result).toBe(lines(
            "SELECT",
            `${T}[System.Id]`,
            "FROM workitemLinks",
            "WHERE",
            `${T}[Source].[System.Id] = 1`,
            `${T}AND [Target].[System.State] = 'x'`,
            "MODE (MustContain)",
            "",
        ));
    });

    it.each([["maycontain", "MayContain"], ["doesnotcontain", "DoesNotContain"]])("formats MODE (%s)", async (input, expected) => {
        expect(await formatted(`select id from workitemlinks mode (${input})`)).toContain(`MODE (${expected})\r\n`);
    });

    it("formats a tree query with its modes", async () => {
        const result = await formatted(
            "select id from workitemlinks where [system.links.linktype] = 'x' mode (recursive, returnmatchingchildren)",
        );
        expect(result).toContain("FROM workitemLinks");
        expect(result).toContain("[System.Links.LinkType] = 'x'");
        expect(result).toContain("MODE (Recursive, ReturnMatchingChildren)");
    });
});

describe("format: editor interaction", () => {
    it("does nothing when the query has a syntax error", async () => {
        expect(await formatted("select from")).toBeNull();
    });

    it("replaces the whole document and resets the selection", async () => {
        const editor = fakeEditor("select id from workitems", tabs);
        await format(editor);

        const [selections, operations, computeSelections] = editor.model.pushEditOperations.mock.calls[0];
        expect(selections).toEqual([]);
        expect(operations).toHaveLength(1);
        expect(operations[0].forceMoveMarkers).toBe(true);
        expect(operations[0].range).toEqual(editor.model.getFullModelRange());
        expect(computeSelections()).toEqual([expect.objectContaining({ selectionStartLineNumber: 1, positionColumn: 1 })]);
    });

    it("indents with spaces when the model uses spaces", async () => {
        const result = await formatted("select id from workitems", { insertSpaces: true, tabSize: 2 });
        expect(result).toContain("\r\n  [System.Id]\r\n");
    });

    it("indents with tabs when the model uses tabs", async () => {
        expect(await formatted("select id from workitems", tabs)).toContain("\r\n\t[System.Id]\r\n");
    });
});

describe("format: field loading", () => {
    it("formats immediately with raw names if fields are not loaded yet, and starts loading them", async () => {
        (fieldsVal.isLoaded as jest.Mock).mockReturnValue(false);
        const result = await formatted("select id from workitems");

        expect(result).toBe(lines("SELECT", `${T}[id]`, "FROM workitems", ""));
        expect(fieldsVal.getValue).toHaveBeenCalledTimes(1);
    });

    it("waits for the fields when they are already loaded", async () => {
        await formatted("select id from workitems");
        expect(fieldsVal.getValue).toHaveBeenCalledTimes(1);
    });
});
