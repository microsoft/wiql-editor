import { freshApi } from "../../helpers/restClients";

const teams = (count: number, prefix = "t") => Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, name: `${prefix}${i}` }));

describe("getTeams", () => {
    it("uses the (project, includeMembers, top, skip) signature on current clients", async () => {
        const api = freshApi();
        const calls: any[][] = [];
        const coreClient = {
            getTeams: function (a: any, b: any, c: any, d: any) { calls.push([a, b, c, d]); return Promise.resolve(teams(2)); },
        };
        api.useClients({}, coreClient);
        const { getTeams } = require("../../../scripts/cachedData/teams");

        expect(await getTeams("proj")).toHaveLength(2);
        expect(calls).toEqual([["proj", false, 100, 0]]);
    });

    it("uses the 3-argument signature on older clients", async () => {
        const api = freshApi();
        const calls: any[][] = [];
        const coreClient = {
            getTeams: function (a: any, b: any, c: any) { calls.push([a, b, c]); return Promise.resolve(teams(1)); },
        };
        api.useClients({}, coreClient);
        const { getTeams } = require("../../../scripts/cachedData/teams");

        await getTeams("proj");
        expect(calls).toEqual([["proj", 100, 0]]);
    });

    it("pages until a short page is returned", async () => {
        const api = freshApi();
        const pages = [teams(100, "a"), teams(100, "b"), teams(5, "c")];
        const skips: number[] = [];
        const coreClient = {
            getTeams: function (_p: any, _m: any, _t: any, skip: any) { skips.push(skip); return Promise.resolve(pages.shift()); },
        };
        api.useClients({}, coreClient);
        const { getTeams } = require("../../../scripts/cachedData/teams");

        expect(await getTeams("proj")).toHaveLength(205);
        expect(skips).toEqual([0, 100, 200]);
    });

    it("caches per project name", async () => {
        const api = freshApi();
        const spy = jest.fn();
        const coreClient = {
            getTeams: function (p: any, _m: any, _t: any, _s: any) { spy(p); return Promise.resolve(teams(1)); },
        };
        api.useClients({}, coreClient);
        const { getTeams } = require("../../../scripts/cachedData/teams");

        await getTeams("one");
        await getTeams("one");
        await getTeams("two");
        expect(spy.mock.calls.map((c) => c[0])).toEqual(["one", "two"]);
    });

    it("rejects when the REST call fails", async () => {
        const api = freshApi();
        api.useClients({}, { getTeams: function (_p: any, _m: any, _t: any, _s: any) { return Promise.reject(new Error("nope")); } });
        const { getTeams } = require("../../../scripts/cachedData/teams");

        await expect(getTeams("x")).rejects.toThrow("nope");
    });
});
