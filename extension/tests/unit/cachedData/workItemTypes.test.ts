import { freshApi, project } from "../../helpers/restClients";

const wit = (name: string, transitions: { [state: string]: string[] } = {}) => ({
    name,
    transitions: Object.keys(transitions).reduce((acc: any, from) => {
        acc[from] = transitions[from].map((to) => ({ to }));
        return acc;
    }, {}),
});

function setup() {
    const api = freshApi();
    const byProject: { [name: string]: any[] } = {
        Alpha: [
            wit("Bug", { "": ["New"], New: ["Active"], Active: ["Closed"] }),
            wit("Task", { "": ["To Do"], "To Do": ["Done"] }),
        ],
        Beta: [wit("Bug", { "": ["Proposed"], Proposed: ["Closed"] }), wit("Epic")],
    };
    const getWorkItemTypes = jest.fn(async (name: string) => byProject[name]);
    api.useClients({ getWorkItemTypes }, { getProjects: jest.fn(async () => [project("Alpha"), project("Beta")]) });
    const mod = require("../../../scripts/cachedData/workItemTypes");
    return { getWorkItemTypes, mod };
}

describe("getWitsByProjects", () => {
    it("returns work item types for each requested project", async () => {
        const { mod } = setup();
        const result = await mod.getWitsByProjects(["Alpha", "Beta"]);
        expect(result.map((w: any) => w.name)).toEqual(["Bug", "Task", "Bug", "Epic"]);
    });

    it("caches each project's work item types", async () => {
        const { getWorkItemTypes, mod } = setup();
        await mod.getWitsByProjects(["Alpha"]);
        await mod.getWitsByProjects(["Alpha", "Beta"]);
        expect(getWorkItemTypes).toHaveBeenCalledTimes(2);
    });

    it("filters by work item type name when searchWits is given", async () => {
        const { mod } = setup();
        const result = await mod.getWitsByProjects(["Alpha", "Beta"], ["Bug"]);
        expect(result.map((w: any) => w.name)).toEqual(["Bug", "Bug"]);
    });

    it("returns an empty list when nothing is requested", async () => {
        const { getWorkItemTypes, mod } = setup();
        expect(await mod.getWitsByProjects([])).toEqual([]);
        expect(getWorkItemTypes).not.toHaveBeenCalled();
    });
});

describe("getWitNamesByProjects", () => {
    it("returns unique names across projects", async () => {
        const { mod } = setup();
        expect((await mod.getWitNamesByProjects(["Alpha", "Beta"])).sort()).toEqual(["Bug", "Epic", "Task"]);
    });

    // The source calls getWitNames() without returning it, so [] is currently not expanded to "all projects".
    it("currently returns an empty list for no projects", async () => {
        const { mod } = setup();
        expect(await mod.getWitNamesByProjects([])).toEqual([]);
    });
});

describe("getStatesByProjects", () => {
    it("collects the start and target states of every transition", async () => {
        const { mod } = setup();
        expect((await mod.getStatesByProjects(["Alpha"], ["Bug"])).sort()).toEqual(["Active", "Closed", "New"]);
    });

    it("excludes empty start states", async () => {
        const { mod } = setup();
        expect(await mod.getStatesByProjects(["Alpha"], ["Task"])).not.toContain("");
    });

    it("unions states across projects and work item types", async () => {
        const { mod } = setup();
        const states = await mod.getStatesByProjects(["Alpha", "Beta"], ["Bug"]);
        expect(states.sort()).toEqual(["Active", "Closed", "New", "Proposed"]);
    });

    it("handles work item types without transitions", async () => {
        const { mod } = setup();
        expect(await mod.getStatesByProjects(["Beta"], ["Epic"])).toEqual([]);
    });
});

describe("allProjectWits / statesVal / witNames", () => {
    it("allProjectWits pairs every project with its work item types", async () => {
        const { mod } = setup();
        const all = await mod.allProjectWits.getValue();
        expect(all.map((a: any) => [a.project.name, a.workItemTypes.length])).toEqual([["Alpha", 2], ["Beta", 2]]);
    });

    it("witNames lists unique names across all projects", async () => {
        const { mod } = setup();
        expect((await mod.witNames.getValue()).sort()).toEqual(["Bug", "Epic", "Task"]);
    });

    it("statesVal lists unique states across all projects", async () => {
        const { mod } = setup();
        expect((await mod.statesVal.getValue()).sort()).toEqual(["Active", "Closed", "Done", "New", "Proposed", "To Do"]);
    });
});
