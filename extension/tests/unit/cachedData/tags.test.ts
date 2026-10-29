import { freshApi, project } from "../../helpers/restClients";

function setup(opts: { hostName?: string, projects?: any[], tagsByProject?: { [id: string]: string[] }, fail?: boolean } = {}) {
    const api = freshApi();
    api.sdk.getHost.mockReturnValue({ name: opts.hostName || "contoso" });
    api.useClients({}, { getProjects: jest.fn(async () => opts.projects || [project("Alpha", "id-a"), project("Beta", "id-b")]) });
    const callApi = jest.fn((url: string, _m: string, _h: any, _d: any, success: Function, failure: Function) => {
        if (opts.fail) {
            failure({ name: "CallFailure" });
            return;
        }
        const id = url.match(/scopes\/([^/]+)\/tags/)![1];
        success({ count: 0, value: ((opts.tagsByProject || {})[id] || []).map((name) => ({ name })) });
    });
    jest.doMock("../../../scripts/RestCall", () => ({ callApi }));
    const tags = require("../../../scripts/cachedData/tags");
    return { api, callApi, tags };
}

describe("getTagsForProjects", () => {
    it("builds the tagging URL from the host and the project id", async () => {
        const { callApi, tags } = setup({ tagsByProject: { "id-a": ["x"] } });
        await tags.getTagsForProjects(["Alpha"]);
        expect(callApi).toHaveBeenCalledTimes(1);
        const [url, method] = callApi.mock.calls[0];
        expect(url).toBe("contoso/DefaultCollection/_apis/tagging/scopes/id-a/tags?api-version=1.0");
        expect(method).toBe("GET");
    });

    it("does not duplicate DefaultCollection when the host already includes it", async () => {
        const { callApi, tags } = setup({ hostName: "https://tfs/DefaultCollection" });
        await tags.getTagsForProjects(["Alpha"]);
        expect(callApi.mock.calls[0][0]).toBe("https://tfs/DefaultCollection/_apis/tagging/scopes/id-a/tags?api-version=1.0");
    });

    it("matches project names case-insensitively and falls back to the raw value if unknown", async () => {
        const { callApi, tags } = setup();
        await tags.getTagsForProjects(["alpha", "unknown-id"]);
        const urls = callApi.mock.calls.map((c) => c[0]);
        expect(urls[0]).toContain("scopes/id-a/");
        expect(urls[1]).toContain("scopes/unknown-id/");
    });

    it("returns tag names merged across projects without duplicates", async () => {
        const { tags } = setup({ tagsByProject: { "id-a": ["bug", "ui"], "id-b": ["ui", "api"] } });
        const result: string[] = await tags.getTagsForProjects(["Alpha", "Beta"]);
        expect(result.sort()).toEqual(["api", "bug", "ui"]);
    });

    it("uses all projects when no project is specified", async () => {
        const { tags } = setup({ tagsByProject: { "id-a": ["bug"], "id-b": ["api"] } });
        const result: string[] = await tags.getTagsForProjects([]);
        expect(result.sort()).toEqual(["api", "bug"]);
    });

    it("rejects when the tagging call fails", async () => {
        const { tags } = setup({ fail: true });
        await expect(tags.getTagsForProjects(["Alpha"])).rejects.toEqual({ name: "CallFailure" });
    });
});

describe("allTagsVal", () => {
    it("is cached", async () => {
        const { callApi, tags } = setup({ tagsByProject: { "id-a": ["t"] } });
        await tags.allTagsVal.getValue();
        const calls = callApi.mock.calls.length;
        await tags.allTagsVal.getValue();
        expect(callApi.mock.calls.length).toBe(calls);
    });
});
