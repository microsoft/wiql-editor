import { freshApi } from "../../helpers/restClients";

function setup() {
    const api = freshApi();
    const cache = { get: jest.fn(), store: jest.fn() };
    jest.doMock("../../../scripts/cachedData/identities/extensionCache", () => cache);

    const user = (id: string) => ({ id, displayName: `User ${id}`, uniqueName: `${id}@x.com` });
    const teamsByProject: { [id: string]: any[] } = {
        p1: [{ id: "t1", name: "Core" }, { id: "t2", name: "UX" }],
        p2: [{ id: "t3", name: "Ops" }],
    };
    const membersByTeam: { [id: string]: any[] } = {
        t1: [user("u1"), user("u2")],
        t2: [user("u2"), user("u3")],
        t3: [user("u4")],
    };
    const core = {
        getProjects: jest.fn(async () => [{ id: "p1", name: "One" }, { id: "p2", name: "Two" }]),
        getTeams: function (pid: any, _members: any, _top: any, skip: any) {
            core.teamCalls.push([pid, skip]);
            return Promise.resolve(teamsByProject[pid] || []);
        },
        teamCalls: [] as any[][],
        getTeamMembersWithExtendedProperties: jest.fn(async (_pid: string, tid: string) =>
            membersByTeam[tid].map((identity) => ({ identity })),
        ),
    };
    api.useClients({}, core);
    return { cache, core, user, getIdentities: require("../../../scripts/cachedData/identities/getIdentities").getIdentities };
}

const ids = (list: any[]) => list.map((i) => i.id).sort();

describe("getIdentities", () => {
    it("returns cached identities without calling REST", async () => {
        const { cache, core, getIdentities } = setup();
        cache.get.mockResolvedValue([
            { id: "p1", name: "One", teams: [{ team: { id: "t1", displayName: "[One]\\Core" }, members: [{ id: "u1" }] }] },
        ]);

        expect(ids(await getIdentities())).toEqual(["t1", "u1"]);
        expect(cache.get).toHaveBeenCalledWith("identities-");
        expect(core.getProjects).not.toHaveBeenCalled();
        expect(cache.store).not.toHaveBeenCalled();
    });

    it("loads every project's teams and members on a cache miss, de-duplicating by id", async () => {
        const { cache, core, getIdentities } = setup();
        cache.get.mockResolvedValue(null);

        const result = await getIdentities();
        expect(ids(result)).toEqual(["t1", "t2", "t3", "u1", "u2", "u3", "u4"]);
        expect(core.getProjects).toHaveBeenCalledTimes(1);
        expect(core.getTeamMembersWithExtendedProperties).toHaveBeenCalledTimes(3);
    });

    it("represents teams as container identities named [Project]\\Team", async () => {
        const { cache, getIdentities } = setup();
        cache.get.mockResolvedValue(null);

        const team = (await getIdentities()).find((i: any) => i.id === "t1");
        expect(team).toEqual({ displayName: "[One]\\Core", id: "t1", isContainer: true });
    });

    it("stores the loaded identities in the extension cache", async () => {
        const { cache, getIdentities } = setup();
        cache.get.mockResolvedValue(null);

        await getIdentities();
        expect(cache.store).toHaveBeenCalledTimes(1);
        const [key, value] = cache.store.mock.calls[0];
        expect(key).toBe("identities-");
        expect(value.map((p: any) => p.name)).toEqual(["One", "Two"]);
        expect(value[0].teams).toHaveLength(2);
    });

    it("scopes to a single project when one is given", async () => {
        const { cache, core, getIdentities } = setup();
        cache.get.mockResolvedValue(null);

        const result = await getIdentities({ id: "p2", name: "Two" });
        expect(ids(result)).toEqual(["t3", "u4"]);
        expect(cache.get).toHaveBeenCalledWith("identities-Two");
        expect(cache.store.mock.calls[0][0]).toBe("identities-Two");
        expect(core.getProjects).not.toHaveBeenCalled();
    });

    it("pages through teams when a full page is returned", async () => {
        const { cache, core, getIdentities } = setup();
        cache.get.mockResolvedValue(null);
        const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: `tx${i}`, name: `X${i}` }));
        const members = (core.getTeamMembersWithExtendedProperties as jest.Mock);
        members.mockImplementation(async (_p: string, t: string) => [{ identity: { id: `m-${t}`, displayName: t } }]);
        core.getTeams = function (pid: any, _m: any, _t: any, skip: any) {
            core.teamCalls.push([pid, skip]);
            return Promise.resolve(skip === 0 ? fullPage : [{ id: "last", name: "Last" }]);
        };

        const result = await getIdentities({ id: "p9", name: "Nine" });
        expect(core.teamCalls).toEqual([["p9", 0], ["p9", 100]]);
        // 101 teams + 101 members
        expect(result).toHaveLength(202);
    });

    it("only loads once per key even when called concurrently", async () => {
        const { cache, core, getIdentities } = setup();
        cache.get.mockResolvedValue(null);

        await Promise.all([getIdentities(), getIdentities()]);
        await getIdentities();
        expect(core.getProjects).toHaveBeenCalledTimes(1);
        expect(cache.get).toHaveBeenCalledTimes(1);
    });

    it("keeps different projects cached separately", async () => {
        const { cache, getIdentities } = setup();
        cache.get.mockResolvedValue(null);

        await getIdentities({ id: "p1", name: "One" });
        await getIdentities({ id: "p2", name: "Two" });
        expect(cache.get.mock.calls.map((c) => c[0])).toEqual(["identities-One", "identities-Two"]);
    });

    it("propagates cache read errors", async () => {
        const { cache, getIdentities } = setup();
        cache.get.mockRejectedValue(new Error("cache down"));
        await expect(getIdentities()).rejects.toThrow("cache down");
    });
});
