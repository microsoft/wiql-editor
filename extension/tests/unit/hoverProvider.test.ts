import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import { fieldsVal } from "../../scripts/cachedData/fields";
import { getWitsByProjects } from "../../scripts/cachedData/workItemTypes";
import { getHoverProvider } from "../../scripts/wiqlEditor/hoverProvider";
import { getFilters } from "../../scripts/wiqlEditor/parseAnalysis/whereClauses";
import { fakeModel, sampleFieldLookup } from "../helpers/fixtures";

jest.mock("../../scripts/cachedData/fields", () => ({
    __esModule: true,
    ...jest.requireActual("../../scripts/cachedData/fields"),
    fieldsVal: { getValue: jest.fn(), isLoaded: jest.fn() },
}));
jest.mock("../../scripts/cachedData/workItemTypes", () => ({ __esModule: true, getWitsByProjects: jest.fn() }));
jest.mock("../../scripts/wiqlEditor/parseAnalysis/whereClauses", () => ({ __esModule: true, getFilters: jest.fn() }));

const provider = getHoverProvider();
const hover = (query: string, column: number, line = 1) =>
    provider.provideHover(fakeModel(query) as any, { lineNumber: line, column } as any, undefined as any) as Promise<any>;
const range = (r: any) => [r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn];

const wit = (name: string, description: string, fieldHelp: { [ref: string]: string } = {}) => ({
    name,
    description,
    fieldInstances: Object.keys(fieldHelp).map((referenceName) => ({ referenceName, helpText: fieldHelp[referenceName] })),
});

beforeEach(() => {
    (fieldsVal.getValue as jest.Mock).mockResolvedValue(sampleFieldLookup());
    (getFilters as jest.Mock).mockResolvedValue({ projects: ["Alpha"], workItemTypes: [] });
    (getWitsByProjects as jest.Mock).mockResolvedValue([]);
});

describe("hover: fields", () => {
    const query = "SELECT [System.Title] FROM workitems";
    // [System.Title]: "[" at 7, identifier 8-20

    it("shows the field type and a range covering the identifier", async () => {
        const result = await hover(query, 12);
        expect(result.contents[0]).toEqual({ value: String(FieldType.String) });
        expect(range(result.range)).toEqual([1, 9, 1, 21]);
    });

    it("includes the field's help text when every work item type agrees", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([
            wit("Bug", "", { "System.Title": "The title" }),
            wit("Task", "", { "System.Title": "The title" }),
        ]);
        const result = await hover(query, 12);
        expect(result.contents).toEqual([{ value: "0" }, { value: "The title" }]);
    });

    it("omits the help text when work item types describe the field differently", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([
            wit("Bug", "", { "System.Title": "One" }),
            wit("Task", "", { "System.Title": "Two" }),
        ]);
        expect((await hover(query, 12)).contents).toHaveLength(1);
    });

    it("ignores help text for other fields and fields without help", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([
            wit("Bug", "", { "System.State": "state help", "System.Title": "" }),
        ]);
        expect((await hover(query, 12)).contents).toHaveLength(1);
    });

    it("scopes the work item type lookup to the query's projects and types", async () => {
        (getFilters as jest.Mock).mockResolvedValue({ projects: ["Alpha"], workItemTypes: ["Bug"] });
        await hover(query, 12);
        expect(getWitsByProjects).toHaveBeenCalledWith(["Alpha"], ["Bug"]);
    });

    it("matches display names too", async () => {
        const result = await hover("SELECT [Work Item Type] FROM workitems", 12);
        expect(result.contents[0]).toEqual({ value: "0" });
    });

    it("shows nothing for unknown fields", async () => {
        expect(await hover("SELECT [Nope] FROM workitems", 10)).toBeNull();
    });

    it("works on later lines", async () => {
        const result = await hover("SELECT id\nFROM workitems\nWHERE title = 'x'", 9, 3);
        expect(result.range.startLineNumber).toBe(3);
    });
});

describe("hover: variables", () => {
    const query = "SELECT id FROM workitems WHERE [Created Date] > @today";
    const col = query.indexOf("@today") + 3;

    it("shows the variable's type", async () => {
        const result = await hover(query, col);
        expect(result.contents).toEqual([{ value: "DateTime" }]);
        expect(range(result.range)).toEqual([1, query.indexOf("@today") + 1, 1, query.indexOf("@today") + 7]);
    });

    it("is case-insensitive", async () => {
        const q = "SELECT id FROM workitems WHERE title = @ME";
        expect((await hover(q, q.indexOf("@ME") + 2)).contents).toEqual([{ value: "String" }]);
    });

    it("shows nothing for unknown variables", async () => {
        const q = "SELECT id FROM workitems WHERE title = @nope";
        expect(await hover(q, q.indexOf("@nope") + 2)).toBeNull();
    });
});

describe("hover: work item types", () => {
    const query = "SELECT id FROM workitems WHERE [System.WorkItemType] = 'Bug'";
    const col = query.indexOf("'Bug'") + 3;

    it("shows the description of the matching work item type", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([wit("Bug", "Tracks defects"), wit("Task", "Tracks work")]);
        const result = await hover(query, col);
        expect(result.contents).toEqual([{ value: "Tracks defects" }]);
        expect(range(result.range)).toEqual([1, query.indexOf("'Bug'") + 1, 1, query.indexOf("'Bug'") + 6]);
    });

    it("matches the name case-insensitively and supports the display name of the field", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([wit("Bug", "Tracks defects")]);
        const q = "SELECT id FROM workitems WHERE [Work Item Type] = 'bUg'";
        expect((await hover(q, q.indexOf("'bUg'") + 2)).contents).toEqual([{ value: "Tracks defects" }]);
    });

    it("shows nothing when no work item type matches", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([wit("Task", "x")]);
        expect(await hover(query, col)).toBeNull();
    });

    it("shows nothing when the name is ambiguous across projects", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([wit("Bug", "a"), wit("Bug", "b")]);
        expect(await hover(query, col)).toBeNull();
    });

    it("does not show work item type info for strings of other fields", async () => {
        (getWitsByProjects as jest.Mock).mockResolvedValue([wit("Bug", "Tracks defects")]);
        const q = "SELECT id FROM workitems WHERE title = 'Bug'";
        expect(await hover(q, q.indexOf("'Bug'") + 2)).toBeNull();
    });
});

describe("hover: other positions", () => {
    it("shows nothing over keywords", async () => {
        expect(await hover("SELECT id FROM workitems", 3)).toBeNull();
    });

    it("shows nothing past the end of the query", async () => {
        expect(await hover("SELECT id FROM workitems", 500)).toBeNull();
    });

    it("still resolves hovers inside a query with a syntax error", async () => {
        const result = await hover("SELECT [System.Title] FROM", 12);
        expect(result.contents[0]).toEqual({ value: "0" });
    });
});
