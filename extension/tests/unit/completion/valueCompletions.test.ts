import { identitiesVal } from "../../../scripts/cachedData/identities";
import { areaStrings, iterationStrings } from "../../../scripts/cachedData/nodes";
import { projectsVal } from "../../../scripts/cachedData/projects";
import { relationTypes } from "../../../scripts/cachedData/relationTypes";
import { getTagsForProjects } from "../../../scripts/cachedData/tags";
import { getCategories } from "../../../scripts/cachedData/workitemTypeCategories";
import { getStatesByProjects, getWitNamesByProjects, witNames } from "../../../scripts/cachedData/workItemTypes";
import { getProject } from "../../../scripts/getProject";
import { getFilters } from "../../../scripts/wiqlEditor/parseAnalysis/whereClauses";
import { getStringValueCompletions } from "../../../scripts/wiqlEditor/completion/valueCompletions";
import { completionContext } from "../../helpers/completion";

jest.mock("../../../scripts/cachedData/identities", () => ({
    __esModule: true,
    ...jest.requireActual("../../../scripts/cachedData/identities"),
    identitiesVal: { getValue: jest.fn() },
}));
jest.mock("../../../scripts/cachedData/nodes", () => ({
    __esModule: true,
    areaStrings: { getValue: jest.fn() },
    iterationStrings: { getValue: jest.fn() },
}));
jest.mock("../../../scripts/cachedData/projects", () => ({ __esModule: true, projectsVal: { getValue: jest.fn() } }));
jest.mock("../../../scripts/cachedData/relationTypes", () => ({ __esModule: true, relationTypes: { getValue: jest.fn() } }));
jest.mock("../../../scripts/cachedData/tags", () => ({ __esModule: true, getTagsForProjects: jest.fn() }));
jest.mock("../../../scripts/cachedData/workitemTypeCategories", () => ({ __esModule: true, getCategories: jest.fn() }));
jest.mock("../../../scripts/cachedData/workItemTypes", () => ({
    __esModule: true,
    getStatesByProjects: jest.fn(),
    getWitNamesByProjects: jest.fn(),
    witNames: { getValue: jest.fn() },
}));
jest.mock("../../../scripts/getProject", () => ({ __esModule: true, getProject: jest.fn() }));
jest.mock("../../../scripts/wiqlEditor/parseAnalysis/whereClauses", () => ({ __esModule: true, getFilters: jest.fn() }));

const Q = "SELECT a FROM workitems WHERE ";
const complete = (where: string) => getStringValueCompletions(completionContext(Q + where));
const mockOf = (fn: unknown) => fn as jest.Mock;

beforeEach(() => {
    mockOf(getFilters).mockResolvedValue({ projects: [], workItemTypes: [] });
});

describe("getStringValueCompletions", () => {
    it("completes identity fields with identities", async () => {
        mockOf(identitiesVal.getValue).mockResolvedValue(["Ada <ada@x.com>"]);
        expect(await complete("[System.AssignedTo] = ")).toEqual(["Ada <ada@x.com>"]);
    });

    it("completes team projects", async () => {
        mockOf(projectsVal.getValue).mockResolvedValue([{ name: "Alpha" }, { name: "Beta" }]);
        expect(await complete("[Team Project] = ")).toEqual(["Alpha", "Beta"]);
    });

    it("completes area and iteration paths", async () => {
        mockOf(areaStrings.getValue).mockResolvedValue(["Alpha\\Area"]);
        mockOf(iterationStrings.getValue).mockResolvedValue(["Alpha\\Sprint 1"]);
        expect(await complete("[System.AreaPath] UNDER ")).toEqual(["Alpha\\Area"]);
        expect(await complete("[Iteration Path] = ")).toEqual(["Alpha\\Sprint 1"]);
    });

    it("completes link types with work item link relations only", async () => {
        mockOf(relationTypes.getValue).mockResolvedValue([
            { referenceName: "System.LinkTypes.Related", attributes: { usage: "workItemLink" } },
            { referenceName: "ArtifactLink", attributes: { usage: "resourceLink" } },
        ]);
        expect(await complete("[System.Links.LinkType] = ")).toEqual(["System.LinkTypes.Related"]);
    });

    describe("work item types", () => {
        it("lists every work item type when the project is not restricted", async () => {
            mockOf(witNames.getValue).mockResolvedValue(["Bug", "Task"]);
            expect(await complete("[Work Item Type] = ")).toEqual(["Bug", "Task"]);
        });

        it("restricts to the project(s) found in the query", async () => {
            mockOf(getFilters).mockResolvedValue({ projects: ["Alpha"], workItemTypes: [] });
            mockOf(getWitNamesByProjects).mockResolvedValue(["Bug"]);
            expect(await complete("[Work Item Type] = ")).toEqual(["Bug"]);
            expect(getWitNamesByProjects).toHaveBeenCalledWith(["Alpha"]);
        });

        it("offers category reference names after GROUP", async () => {
            mockOf(getFilters).mockResolvedValue({ projects: ["Alpha"], workItemTypes: [] });
            mockOf(getCategories).mockResolvedValue([{ referenceName: "Microsoft.BugCategory" }]);
            expect(await complete("[Work Item Type] IN GROUP ")).toEqual(["Microsoft.BugCategory"]);
            expect(getCategories).toHaveBeenCalledWith(["Alpha"]);
        });
    });

    describe("states", () => {
        it("lists states for the projects and work item types in the query", async () => {
            mockOf(getFilters).mockResolvedValue({ projects: ["Alpha"], workItemTypes: ["Bug"] });
            mockOf(getStatesByProjects).mockResolvedValue(["New", "Active"]);
            expect(await complete("[System.State] = ")).toEqual(["New", "Active"]);
            expect(getStatesByProjects).toHaveBeenCalledWith(["Alpha"], ["Bug"]);
        });
    });

    describe("tags", () => {
        it("uses the projects found in the query", async () => {
            mockOf(getFilters).mockResolvedValue({ projects: ["Alpha"], workItemTypes: [] });
            mockOf(getTagsForProjects).mockResolvedValue(["ui"]);
            expect(await complete("[System.Tags] CONTAINS ")).toEqual(["ui"]);
            expect(getTagsForProjects).toHaveBeenCalledWith(["Alpha"]);
        });

        it("falls back to the current project", async () => {
            mockOf(getProject).mockResolvedValue({ id: "proj-id", name: "Current" });
            mockOf(getTagsForProjects).mockResolvedValue(["api"]);
            expect(await complete("[System.Tags] CONTAINS ")).toEqual(["api"]);
            expect(getTagsForProjects).toHaveBeenCalledWith(["proj-id"]);
        });
    });

    it("returns nothing when no string is expected at the cursor", async () => {
        expect(await complete("[System.State] ")).toEqual([]);
    });

    it("returns nothing for fields without value suggestions", async () => {
        expect(await complete("[Title] = ")).toEqual([]);
    });

    it("returns nothing for unknown fields", async () => {
        expect(await complete("[Nope] = ")).toEqual([]);
    });
});
