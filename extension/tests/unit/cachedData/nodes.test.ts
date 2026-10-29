import { freshApi, project } from "../../helpers/restClients";

const node = (name: string, children?: any[]) => ({ name, children });

function setup() {
    const api = freshApi();
    const trees: { [key: string]: any } = {
        "Alpha:1": node("Alpha", [node("Sprint 1", [node("Week 1")]), node("Sprint 2")]),
        "Beta:1": node("Beta"),
        "Alpha:0": node("Alpha", [node("Team A")]),
        "Beta:0": node("Beta", [node("Team B")]),
    };
    const getClassificationNode = jest.fn(async (proj: string, group: number) => trees[`${proj}:${group}`]);
    api.useClients({ getClassificationNode }, { getProjects: jest.fn(async () => [project("Alpha"), project("Beta")]) });
    const nodes = require("../../../scripts/cachedData/nodes");
    return { api, getClassificationNode, nodes };
}

describe("iterationNodesByProject / areaNodesByProject", () => {
    it("fetches the full-depth tree for every project", async () => {
        const { api, getClassificationNode, nodes } = setup();
        const result = await nodes.iterationNodesByProject.getValue();

        expect(result.map((r: any) => r.project.name)).toEqual(["Alpha", "Beta"]);
        expect(getClassificationNode).toHaveBeenCalledWith("Alpha", api.TreeStructureGroup.Iterations, undefined, 2147483647);
        expect(getClassificationNode).toHaveBeenCalledWith("Beta", api.TreeStructureGroup.Iterations, undefined, 2147483647);
    });

    it("requests area nodes with the Areas group", async () => {
        const { api, getClassificationNode, nodes } = setup();
        await nodes.areaNodesByProject.getValue();
        expect(getClassificationNode).toHaveBeenCalledWith("Alpha", api.TreeStructureGroup.Areas, undefined, 2147483647);
    });
});

describe("iterationStrings / areaStrings", () => {
    it("flattens the tree into backslash-delimited paths", async () => {
        const { nodes } = setup();
        const paths: string[] = await nodes.iterationStrings.getValue();
        expect(paths.sort()).toEqual([
            "Alpha",
            "Alpha\\Sprint 1",
            "Alpha\\Sprint 1\\Week 1",
            "Alpha\\Sprint 2",
            "Beta",
        ]);
    });

    it("builds area paths from the area trees", async () => {
        const { nodes } = setup();
        const paths: string[] = await nodes.areaStrings.getValue();
        expect(paths.sort()).toEqual(["Alpha", "Alpha\\Team A", "Beta", "Beta\\Team B"]);
    });

    it("reuses the cached node trees", async () => {
        const { getClassificationNode, nodes } = setup();
        await nodes.iterationStrings.getValue();
        await nodes.iterationNodesByProject.getValue();
        expect(getClassificationNode).toHaveBeenCalledTimes(2);
    });
});
