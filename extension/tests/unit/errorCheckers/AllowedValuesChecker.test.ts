import { CachedValue } from "../../../scripts/cachedData/CachedValue";
import { AllowedValuesChecker } from "../../../scripts/wiqlEditor/errorCheckers/AllowedValuesChecker";
import { messages, parseQuery } from "../../helpers/fixtures";

function setup(values: string[], message?: string) {
    const generator = jest.fn(async () => values);
    const checker = new AllowedValuesChecker("System.IterationPath", "Iteration Path", new CachedValue(generator), message);
    const run = async (where: string) => messages(await checker.check(parseQuery(`SELECT a FROM workitems WHERE ${where}`)));
    return { generator, run };
}

describe("AllowedValuesChecker", () => {
    it("accepts allowed values with either quote style, ignoring case", async () => {
        const { run } = setup(["Proj\\Sprint 1"]);
        expect(await run(`[System.IterationPath] = 'proj\\sprint 1'`)).toEqual([]);
        expect(await run(`[Iteration Path] = "PROJ\\SPRINT 1"`)).toEqual([]);
    });

    it("flags values that are not allowed", async () => {
        const { run } = setup(["Proj\\Sprint 1"]);
        expect(await run(`[Iteration Path] = 'Proj\\Sprint 9'`)).toEqual(["Invalid Iteration Path value"]);
    });

    it("uses the custom error message when supplied", async () => {
        const { run } = setup([], "No such sprint");
        expect(await run(`[Iteration Path] = 'x'`)).toEqual(["No such sprint"]);
    });

    it("does not load allowed values when the field is not used", async () => {
        const { run, generator } = setup(["a"]);
        expect(await run("a = 'x'")).toEqual([]);
        expect(generator).not.toHaveBeenCalled();
    });

    it("checks each entry of an IN list independently", async () => {
        const { run } = setup(["A", "B"]);
        expect(await run(`[Iteration Path] IN ('A', 'bad', 'B', 'worse')`)).toEqual([
            "Invalid Iteration Path value",
            "Invalid Iteration Path value",
        ]);
    });

    it("ignores non-string values", async () => {
        const { run } = setup(["A"]);
        expect(await run(`[Iteration Path] = @currentiteration`)).toEqual([]);
        expect(await run(`[Iteration Path] = 5`)).toEqual([]);
    });

    it("also checks conditions in link queries", async () => {
        const { generator } = setup(["A"]);
        const checker = new AllowedValuesChecker("System.IterationPath", "Iteration Path", new CachedValue(generator));
        const query = `SELECT a FROM workitemLinks WHERE [Source].[Iteration Path] = 'bad' MODE (MustContain)`;
        expect(messages(await checker.check(parseQuery(query)))).toEqual(["Invalid Iteration Path value"]);
    });

    it("reports nothing for a query that does not parse far enough", async () => {
        const { run } = setup(["A"]);
        expect(await run("")).toEqual([]);
    });
});
