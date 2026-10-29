import { freshApi } from "../../helpers/restClients";

function setup() {
    const api = freshApi();
    const manager = { getDocument: jest.fn(), setDocument: jest.fn(async () => undefined) };
    const dataService = { getExtensionDataManager: jest.fn(async () => manager) };
    api.sdk.getService.mockResolvedValue(dataService);
    return { api, manager, dataService, cache: require("../../../scripts/cachedData/identities/extensionCache") };
}

const entry = (over: object = {}) => ({ id: "k", value: { a: 1 }, formatVersion: 2, expiration: "", __etag: -1, ...over });

describe("extensionCache.get", () => {
    it("returns the stored value", async () => {
        const { manager, cache } = setup();
        manager.getDocument.mockResolvedValue(entry());
        expect(await cache.get("k")).toEqual({ a: 1 });
        expect(manager.getDocument).toHaveBeenCalledWith("extension-cache", "k");
    });

    it("asks the data service for a manager scoped to this extension", async () => {
        const { api, manager, dataService, cache } = setup();
        manager.getDocument.mockResolvedValue(entry());
        await cache.get("k");
        expect(dataService.getExtensionDataManager).toHaveBeenCalledWith("ext-id", expect.any(String));
        expect(api.sdk.getService).toHaveBeenCalled();
    });

    it("ignores entries written with a different format version", async () => {
        const { manager, cache } = setup();
        manager.getDocument.mockResolvedValue(entry({ formatVersion: 1 }));
        expect(await cache.get("k")).toBeNull();
    });

    it("ignores expired entries", async () => {
        const { manager, cache } = setup();
        manager.getDocument.mockResolvedValue(entry({ expiration: new Date(Date.now() - 60000).toJSON() }));
        expect(await cache.get("k")).toBeNull();
    });

    it("returns entries whose expiration is in the future", async () => {
        const { manager, cache } = setup();
        manager.getDocument.mockResolvedValue(entry({ expiration: new Date(Date.now() + 60000).toJSON() }));
        expect(await cache.get("k")).toEqual({ a: 1 });
    });

    it.each([404, 401])("treats a %s response as a cache miss", async (status) => {
        const { manager, cache } = setup();
        manager.getDocument.mockRejectedValue({ status });
        expect(await cache.get("k")).toBeNull();
    });

    it("rethrows other failures", async () => {
        const { manager, cache } = setup();
        const error = { status: 500, message: "server error" };
        manager.getDocument.mockRejectedValue(error);
        await expect(cache.get("k")).rejects.toBe(error);
    });
});

describe("extensionCache.store", () => {
    it("writes a versioned document to the extension-cache collection", async () => {
        const { manager, cache } = setup();
        await cache.store("k", { a: 1 });
        expect(manager.setDocument).toHaveBeenCalledWith("extension-cache", {
            id: "k",
            value: { a: 1 },
            formatVersion: 2,
            expiration: "",
            __etag: -1,
        });
    });

    it("serialises the expiration date", async () => {
        const { manager, cache } = setup();
        const expiration = new Date("2030-01-01T00:00:00Z");
        await cache.store("k", 1, expiration);
        expect((manager.setDocument.mock.calls[0] as any[])[1].expiration).toBe(expiration.toJSON());
    });

    it("propagates storage errors", async () => {
        const { manager, cache } = setup();
        manager.setDocument.mockRejectedValue(new Error("quota"));
        await expect(cache.store("k", 1)).rejects.toThrow("quota");
    });
});
