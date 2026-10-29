import { freshApi, project } from "../../helpers/restClients";

const many = (count: number, prefix = "p") => Array.from({ length: count }, (_, i) => project(`${prefix}${i}`));

describe("projectsVal", () => {
    it("fetches a single page", async () => {
        const api = freshApi();
        const getProjects = jest.fn(async () => [project("A"), project("B")]);
        api.useClients({}, { getProjects });
        const { projectsVal } = require("../../../scripts/cachedData/projects");

        expect((await projectsVal.getValue()).map((p: any) => p.name)).toEqual(["A", "B"]);
        expect(getProjects).toHaveBeenCalledTimes(1);
        expect(getProjects).toHaveBeenCalledWith(undefined, 100, 0);
    });

    it("keeps requesting pages while they are full", async () => {
        const api = freshApi();
        const getProjects = jest.fn()
            .mockResolvedValueOnce(many(100, "a"))
            .mockResolvedValueOnce(many(100, "b"))
            .mockResolvedValueOnce(many(3, "c"));
        api.useClients({}, { getProjects });
        const { projectsVal } = require("../../../scripts/cachedData/projects");

        const all = await projectsVal.getValue();
        expect(all).toHaveLength(203);
        expect(getProjects.mock.calls.map((c) => c[2])).toEqual([0, 100, 200]);
    });

    it("stops after an exactly-empty trailing page", async () => {
        const api = freshApi();
        const getProjects = jest.fn().mockResolvedValueOnce(many(100)).mockResolvedValueOnce([]);
        api.useClients({}, { getProjects });
        const { projectsVal } = require("../../../scripts/cachedData/projects");

        expect(await projectsVal.getValue()).toHaveLength(100);
        expect(getProjects).toHaveBeenCalledTimes(2);
    });

    it("caches the result", async () => {
        const api = freshApi();
        const getProjects = jest.fn(async () => [project("A")]);
        api.useClients({}, { getProjects });
        const { projectsVal } = require("../../../scripts/cachedData/projects");

        await projectsVal.getValue();
        await projectsVal.getValue();
        expect(getProjects).toHaveBeenCalledTimes(1);
    });

    it("propagates REST failures", async () => {
        const api = freshApi();
        api.useClients({}, { getProjects: jest.fn().mockRejectedValue(new Error("403")) });
        const { projectsVal } = require("../../../scripts/cachedData/projects");

        await expect(projectsVal.getValue()).rejects.toThrow("403");
    });
});
