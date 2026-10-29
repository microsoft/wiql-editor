import { freshApi, project } from "../../helpers/restClients";

function setup() {
    const api = freshApi();
    const categories: { [name: string]: any[] } = {
        Alpha: [{ referenceName: "Microsoft.BugCategory" }],
        Beta: [{ referenceName: "Microsoft.RequirementCategory" }, { referenceName: "Microsoft.TaskCategory" }],
    };
    const getWorkItemTypeCategories = jest.fn(async (name: string) => categories[name]);
    api.useClients({ getWorkItemTypeCategories }, { getProjects: jest.fn(async () => [project("Alpha"), project("Beta")]) });
    return { getWorkItemTypeCategories, mod: require("../../../scripts/cachedData/workitemTypeCategories") };
}

describe("getCategories", () => {
    it("returns categories for the given projects", async () => {
        const { mod } = setup();
        const result = await mod.getCategories(["Beta"]);
        expect(result.map((c: any) => c.referenceName)).toEqual(["Microsoft.RequirementCategory", "Microsoft.TaskCategory"]);
    });

    it("concatenates categories from multiple projects", async () => {
        const { mod } = setup();
        expect(await mod.getCategories(["Alpha", "Beta"])).toHaveLength(3);
    });

    it("uses all projects when none are given", async () => {
        const { getWorkItemTypeCategories, mod } = setup();
        expect(await mod.getCategories()).toHaveLength(3);
        expect(getWorkItemTypeCategories).toHaveBeenCalledTimes(2);
    });

    it("caches per project", async () => {
        const { getWorkItemTypeCategories, mod } = setup();
        await mod.getCategories(["Alpha"]);
        await mod.getCategories(["Alpha"]);
        expect(getWorkItemTypeCategories).toHaveBeenCalledTimes(1);
    });
});
