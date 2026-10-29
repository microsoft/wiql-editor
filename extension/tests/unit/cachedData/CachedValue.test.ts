import { CachedValue } from "../../../scripts/cachedData/CachedValue";

describe("CachedValue", () => {
    it("does not call the generator until a value is requested", () => {
        const generator = jest.fn(async () => 1);
        const cached = new CachedValue(generator);
        expect(generator).not.toHaveBeenCalled();
        expect(cached.isLoaded()).toBe(false);
    });

    it("generates the value once and reuses it", async () => {
        const generator = jest.fn(async () => ({ id: 1 }));
        const cached = new CachedValue(generator);
        const first = await cached.getValue();
        const second = await cached.getValue();
        expect(first).toBe(second);
        expect(generator).toHaveBeenCalledTimes(1);
        expect(cached.isLoaded()).toBe(true);
    });

    it("shares one in-flight request between concurrent callers", async () => {
        let resolve!: (v: string) => void;
        const generator = jest.fn(() => new Promise<string>((r) => { resolve = r; }));
        const cached = new CachedValue(generator);
        const a = cached.getValue();
        const b = cached.getValue();
        expect(cached.isLoaded()).toBe(false);
        resolve("done");
        expect(await Promise.all([a, b])).toEqual(["done", "done"]);
        expect(generator).toHaveBeenCalledTimes(1);
    });

    it("is only loaded once the promise has resolved", async () => {
        let resolve!: (v: number) => void;
        const cached = new CachedValue(() => new Promise<number>((r) => { resolve = r; }));
        const pending = cached.getValue();
        expect(cached.isLoaded()).toBe(false);
        resolve(5);
        await pending;
        expect(cached.isLoaded()).toBe(true);
    });

    it("propagates generator failures and is not marked as loaded", async () => {
        const cached = new CachedValue<number>(() => Promise.reject(new Error("boom")));
        await expect(cached.getValue()).rejects.toThrow("boom");
        expect(cached.isLoaded()).toBe(false);
    });

    it("does not retry after a failure (the rejected promise stays cached)", async () => {
        const generator = jest.fn(() => Promise.reject(new Error("boom")));
        const cached = new CachedValue<number>(generator);
        await expect(cached.getValue()).rejects.toThrow("boom");
        await expect(cached.getValue()).rejects.toThrow("boom");
        expect(generator).toHaveBeenCalledTimes(1);
    });

    it("supports PromiseLike generators", async () => {
        const thenable: PromiseLike<number> = { then: (onFulfilled: any) => Promise.resolve(7).then(onFulfilled) };
        expect(await new CachedValue(() => thenable).getValue()).toBe(7);
    });
});
