import { getHoverProvider } from "../../scripts/wiqlEditor/hoverProvider";
import { installBackend } from "../helpers/fakeBackend";
import { fakeModel } from "../helpers/fixtures";

jest.mock("../../scripts/RestCall", () => ({ callApi: jest.fn() }));

beforeAll(() => {
    installBackend();
});

const provider = getHoverProvider();
async function hoverAt(query: string, needle: string, offset = 2): Promise<any> {
    const column = query.indexOf(needle) + offset;
    return provider.provideHover(fakeModel(query) as any, { lineNumber: 1, column } as any, undefined as any);
}

describe("hover with real query analysis and backend data", () => {
    it("describes a field using the help text from the project's work item types", async () => {
        const query = "SELECT [System.Title] FROM workitems WHERE [System.TeamProject] = 'alpha' AND [System.WorkItemType] = 'Bug'";
        const result = await hoverAt(query, "System.Title");
        expect(result.contents).toEqual([{ value: "0" }, { value: "Short summary" }]);
    });

    it("shows only the field type when the query does not narrow down the work item types", async () => {
        const result = await hoverAt("SELECT [System.Title] FROM workitems", "System.Title");
        expect(result.contents).toEqual([{ value: "0" }]);
    });

    it("describes a work item type named in the query", async () => {
        const query = "SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = 'Alpha' AND [System.WorkItemType] = 'Bug'";
        const result = await hoverAt(query, "'Bug'");
        expect(result.contents).toEqual([{ value: "Tracks defects" }]);
    });

    it("picks the description of the work item type from the project named in the query", async () => {
        const query = "SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = 'Beta' AND [System.WorkItemType] = 'Bug'";
        const result = await hoverAt(query, "'Bug'");
        expect(result.contents).toEqual([{ value: "Beta defects" }]);
    });

    it("cannot disambiguate a work item type without a project", async () => {
        const query = "SELECT [System.Id] FROM workitems WHERE [System.WorkItemType] = 'Bug'";
        expect(await hoverAt(query, "'Bug'")).toBeNull();
    });

    it("does not use filters from an OR branch", async () => {
        const query = "SELECT [System.Title] FROM workitems WHERE [System.TeamProject] = 'Alpha' OR [System.State] = 'x'";
        const result = await hoverAt(query, "System.Title");
        expect(result.contents).toHaveLength(1);
    });

    it("shows the type of a variable", async () => {
        const query = "SELECT [System.Id] FROM workitems WHERE [System.CreatedDate] > @today";
        const result = await hoverAt(query, "@today");
        expect(result.contents).toEqual([{ value: "DateTime" }]);
    });

    it("shows nothing for punctuation and keywords", async () => {
        expect(await hoverAt("SELECT [System.Id] FROM workitems", "FROM")).toBeNull();
    });
});
