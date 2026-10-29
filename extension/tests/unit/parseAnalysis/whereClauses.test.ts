import { projectsVal } from "../../../scripts/cachedData/projects";
import { fieldsVal } from "../../../scripts/cachedData/fields";
import { getWitNamesByProjects } from "../../../scripts/cachedData/workItemTypes";
import { getProject } from "../../../scripts/getProject";
import { getFilters } from "../../../scripts/wiqlEditor/parseAnalysis/whereClauses";
import { parseQuery, sampleFieldLookup } from "../../helpers/fixtures";

jest.mock("../../../scripts/cachedData/fields", () => ({
    __esModule: true,
    ...jest.requireActual("../../../scripts/cachedData/fields"),
    fieldsVal: { getValue: jest.fn(), isLoaded: jest.fn() },
}));
jest.mock("../../../scripts/cachedData/projects", () => ({ __esModule: true, projectsVal: { getValue: jest.fn() } }));
jest.mock("../../../scripts/cachedData/workItemTypes", () => ({ __esModule: true, getWitNamesByProjects: jest.fn() }));
jest.mock("../../../scripts/getProject", () => ({ __esModule: true, getProject: jest.fn() }));

const filters = (where: string) => getFilters(parseQuery(`SELECT a FROM workitems WHERE ${where}`));

beforeEach(() => {
    (fieldsVal.getValue as jest.Mock).mockResolvedValue(sampleFieldLookup());
    (projectsVal.getValue as jest.Mock).mockResolvedValue([{ name: "Alpha" }, { name: "Beta" }]);
    (getProject as jest.Mock).mockResolvedValue({ id: "cur", name: "Current" });
    (getWitNamesByProjects as jest.Mock).mockResolvedValue(["Bug", "Task", "Epic"]);
});

describe("getFilters", () => {
    it("returns empty filters for a query without a where clause", async () => {
        expect(await getFilters(parseQuery("SELECT a FROM workitems"))).toEqual({ projects: [], workItemTypes: [] });
    });

    it("returns empty filters for a syntax error", async () => {
        expect(await getFilters(parseQuery("SELECT a FROM"))).toEqual({ projects: [], workItemTypes: [] });
    });

    it("extracts the project from an equality condition using the server's casing", async () => {
        expect(await filters("[System.TeamProject] = 'alpha'")).toEqual({ projects: ["Alpha"], workItemTypes: [] });
        expect(getWitNamesByProjects).toHaveBeenCalledWith(["Alpha"]);
    });

    it("recognises the display name of the project field and double-quoted strings", async () => {
        expect((await filters(`[Team Project] = "BETA"`)).projects).toEqual(["Beta"]);
    });

    it("extracts work item types and restricts them to the projects' types", async () => {
        const result = await filters("[System.TeamProject] = 'alpha' AND [System.WorkItemType] = 'bug'");
        expect(result).toEqual({ projects: ["Alpha"], workItemTypes: ["Bug"] });
    });

    it("drops projects and types that do not exist", async () => {
        const result = await filters("[System.TeamProject] = 'nope' AND [System.WorkItemType] = 'nonsense'");
        expect(result).toEqual({ projects: [], workItemTypes: [] });
    });

    it("collects several values and removes duplicates", async () => {
        const result = await filters(
            "[System.TeamProject] = 'alpha' AND [System.TeamProject] = 'ALPHA' AND [System.TeamProject] = 'beta' " +
            "AND [System.WorkItemType] = 'bug' AND [System.WorkItemType] = 'Task'",
        );
        expect(result.projects.sort()).toEqual(["Alpha", "Beta"]);
        expect(result.workItemTypes.sort()).toEqual(["Bug", "Task"]);
    });

    it("ignores non-equality project conditions entirely", async () => {
        expect((await filters("[System.TeamProject] = 'alpha' AND [System.TeamProject] <> 'beta'")).projects).toEqual([]);
    });

    it("ignores non-equality work item type conditions entirely", async () => {
        expect((await filters("[System.WorkItemType] <> 'Bug'")).workItemTypes).toEqual([]);
    });

    it("ignores non-string comparison values", async () => {
        expect((await filters("[System.WorkItemType] = [System.Title]")).workItemTypes).toEqual([]);
    });

    it("does not trust conditions combined with OR", async () => {
        const result = await filters("[System.TeamProject] = 'alpha' OR [System.Title] = 'x'");
        expect(result.projects).toEqual([]);
    });

    it("uses AND conditions that sit next to a parenthesised OR group", async () => {
        const result = await filters("([System.Title] = 'x' OR [System.Title] = 'y') AND [System.TeamProject] = 'beta'");
        expect(result.projects).toEqual(["Beta"]);
    });

    it("descends into parenthesised AND groups", async () => {
        const result = await filters("([System.TeamProject] = 'alpha' AND [System.WorkItemType] = 'bug')");
        expect(result).toEqual({ projects: ["Alpha"], workItemTypes: ["Bug"] });
    });

    it("ignores conditions on other fields", async () => {
        expect(await filters("[System.State] = 'Active'")).toEqual({ projects: [], workItemTypes: [] });
    });
});
