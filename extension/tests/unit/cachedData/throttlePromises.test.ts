import { throttlePromises } from "../../../scripts/cachedData/identities/throttlePromises";

describe("throttlePromises", () => {
    it("resolves with results in input order", async () => {
        const result = await throttlePromises([1, 2, 3, 4, 5], async (n) => n * 10, 2);
        expect(result).toEqual([10, 20, 30, 40, 50]);
    });

    it("resolves immediately for an empty input", async () => {
        const convert = jest.fn();
        expect(await throttlePromises([], convert, 3)).toEqual([]);
        expect(convert).not.toHaveBeenCalled();
    });

    it("never runs more than batchsize conversions at once", async () => {
        let running = 0;
        let peak = 0;
        const convert = async (n: number) => {
            running++;
            peak = Math.max(peak, running);
            await new Promise((r) => setTimeout(r, 1));
            running--;
            return n;
        };
        const result = await throttlePromises([1, 2, 3, 4, 5, 6, 7], convert, 3);
        expect(result).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(peak).toBe(3);
    });

    it("only starts the next batch after the current one finishes", async () => {
        const started: number[] = [];
        const resolvers: Array<() => void> = [];
        const convert = (n: number) => {
            started.push(n);
            return new Promise<number>((resolve) => resolvers.push(() => resolve(n)));
        };
        const promise = throttlePromises([1, 2, 3, 4], convert, 2);
        expect(started).toEqual([1, 2]);
        resolvers.splice(0).forEach((r) => r());
        await new Promise((r) => setTimeout(r, 0));
        expect(started).toEqual([1, 2, 3, 4]);
        resolvers.splice(0).forEach((r) => r());
        expect(await promise).toEqual([1, 2, 3, 4]);
    });

    it("handles a final partial batch", async () => {
        expect(await throttlePromises([1, 2, 3], async (n) => n, 2)).toEqual([1, 2, 3]);
    });

    it("rejects when any conversion fails and stops scheduling", async () => {
        const convert = jest.fn(async (n: number) => {
            if (n === 2) {
                throw new Error("bad item");
            }
            return n;
        });
        await expect(throttlePromises([1, 2, 3, 4, 5], convert, 2)).rejects.toThrow("bad item");
        expect(convert).toHaveBeenCalledTimes(2);
    });
});
