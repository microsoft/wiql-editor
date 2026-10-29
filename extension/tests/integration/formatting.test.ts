import { fieldsVal } from "../../scripts/cachedData/fields";
import { ParseError } from "../../scripts/wiqlEditor/compiler/parser";
import { ErrorChecker } from "../../scripts/wiqlEditor/errorCheckers/ErrorChecker";
import { format } from "../../scripts/wiqlEditor/formatter";
import { installBackend } from "../helpers/fakeBackend";
import { appliedText, fakeEditor, messages, parseQuery } from "../helpers/fixtures";

jest.mock("../../scripts/RestCall", () => ({ callApi: jest.fn() }));

beforeAll(async () => {
    installBackend();
    await fieldsVal.getValue();
});

const tabs = { insertSpaces: false, tabSize: 4 };
async function formatted(text: string) {
    const editor = fakeEditor(text, tabs);
    await format(editor);
    return appliedText(editor.model) as string;
}
const toLines = (text: string) => text.replace(/\r\n/g, "\n");
const diagnostics = async (text: string) => messages(await new ErrorChecker().check(parseQuery(toLines(text))));

const MESSY =
    "select  id ,title,[work item type]   from workitems\n" +
    "where [team project]=@project and ( state='Active' or state = 'New' )\n" +
    "and [Assigned To] in ('Ada','Grace') and tags contains 'ui' and [created date] >= @today-7\n" +
    "order by id desc,title";

describe("format -> parse -> check", () => {
    it("normalises a messy query using server field metadata", async () => {
        expect(await formatted(MESSY)).toBe([
            "SELECT",
            "\t[System.Id],",
            "\t[System.Title],",
            "\t[System.WorkItemType]",
            "FROM workitems",
            "WHERE",
            "\t[System.TeamProject] = @project",
            "\tAND (",
            "\t\t[System.State] = 'Active'",
            "\t\tOR [System.State] = 'New'",
            "\t)",
            "\tAND [System.AssignedTo] IN ('Ada', 'Grace')",
            "\tAND [System.Tags] CONTAINS 'ui'",
            "\tAND [System.CreatedDate] >= @today - 7",
            "ORDER BY [System.Id] DESC,",
            "\t[System.Title]",
            "",
        ].join("\r\n"));
    });

    it("always produces a query that still parses", async () => {
        const result = parseQuery(toLines(await formatted(MESSY)));
        expect(result).not.toBeInstanceOf(ParseError);
    });

    it("does not change what the diagnostics report", async () => {
        const broken = "select id from workitems where state = 5 and [bogus] = 'x'";
        const before = await diagnostics(broken);
        const after = await diagnostics(await formatted(broken));
        expect(before.length).toBeGreaterThan(0);
        expect(after).toEqual(before);
    });

    it("is stable when applied repeatedly", async () => {
        const once = await formatted(MESSY);
        const twice = await formatted(toLines(once));
        const thrice = await formatted(toLines(twice));
        expect(twice).toBe(once);
        expect(thrice).toBe(once);
    });

    it.each([
        "select id from workitems",
        "select id from workitems where id in (1,2,3) order by id",
        "select id from workitems where title is not empty asof '2020-01-01'",
        "select id from workitemlinks where [source].state = 'a' and [target].state = 'b' mode (maycontain)",
        "select id from workitemlinks where [system.links.linktype] = 'System.LinkTypes.Hierarchy-Forward' mode (recursive)",
    ])("keeps %s valid and stable", async (query) => {
        const once = await formatted(query);
        expect(parseQuery(toLines(once))).not.toBeInstanceOf(ParseError);
        expect(await formatted(toLines(once))).toBe(once);
    });

    it("leaves a query with a syntax error untouched", async () => {
        const editor = fakeEditor("select from where", tabs);
        await format(editor);
        expect(editor.model.pushEditOperations).not.toHaveBeenCalled();
    });
});
