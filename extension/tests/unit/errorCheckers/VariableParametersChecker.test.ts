import { projectsVal } from "../../../scripts/cachedData/projects";
import { getTeams } from "../../../scripts/cachedData/teams";
import { VariableParametersChecker } from "../../../scripts/wiqlEditor/errorCheckers/VariableParametersChecker";
import { messages, parseQuery } from "../../helpers/fixtures";

jest.mock("../../../scripts/cachedData/projects", () => ({
    __esModule: true,
    projectsVal: { getValue: jest.fn() },
}));
jest.mock("../../../scripts/cachedData/teams", () => ({
    __esModule: true,
    getTeams: jest.fn(),
}));

const checker = new VariableParametersChecker();
const run = (where: string) => checker.check(parseQuery(`SELECT a FROM workitems WHERE ${where}`));

beforeEach(() => {
    (projectsVal.getValue as jest.Mock).mockResolvedValue([{ name: "Alpha" }, { name: "Beta" }]);
    (getTeams as jest.Mock).mockResolvedValue([{ name: "Core" }, { name: "UX" }]);
});

describe("VariableParametersChecker: @today", () => {
    it("accepts plain and offset usage", async () => {
        expect(await run("a = @today")).toEqual([]);
        expect(await run("a = @today - 7")).toEqual([]);
    });

    it("rejects arguments", async () => {
        expect(messages(await run("a = @today('x')"))).toEqual(["@Today does not accept arguments"]);
    });
});

describe("VariableParametersChecker: default variables", () => {
    it("accepts bare variables", async () => {
        expect(await run("a = @me AND b = @project")).toEqual([]);
    });

    it("rejects arguments and offsets", async () => {
        expect(messages(await run("a = @me('x')"))).toEqual(["@me does not accept arguments"]);
        expect(messages(await run("a = @me + 1"))).toEqual(["@me does not accept an offset"]);
    });
});

describe.each(["@currentiteration", "@teamareas"])("VariableParametersChecker: %s", (variable) => {
    it("accepts a valid [project]\\team argument (case-insensitive)", async () => {
        expect(await run(`a = ${variable}('[Alpha]\\Core')`)).toEqual([]);
        expect(await run(`a = ${variable}('[alpha]\\ux')`)).toEqual([]);
        expect(await run(`a = ${variable}("[BETA]\\core")`)).toEqual([]);
    });

    it("accepts the variable with no arguments", async () => {
        expect(await run(`a = ${variable}`)).toEqual([]);
    });

    it("looks up teams for the lower-cased project name", async () => {
        await run(`a = ${variable}('[Alpha]\\Core')`);
        expect(getTeams).toHaveBeenCalledWith("alpha");
    });

    it("requires a string argument", async () => {
        expect(messages(await run(`a = ${variable}(5)`))).toEqual(["Team must be a string"]);
    });

    it("rejects more than one argument", async () => {
        const result = messages(await run(`a = ${variable}('[Alpha]\\Core', 'x')`));
        expect(result).toEqual([`${variable} only takes 1 argument`]);
    });

    it("requires the '[project]\\team' format", async () => {
        expect(messages(await run(`a = ${variable}('Alpha Core')`))).toEqual(["Team must be of format '[project]\\team'"]);
    });

    it("lists known projects when the project does not exist and highlights just the project name", async () => {
        const result = await run(`a = ${variable}('[Nope]\\Core')`);
        expect(messages(result)).toEqual(["Project does not exist - expecting one of\n\n Alpha, Beta"]);
        expect(getTeams).not.toHaveBeenCalled();
        const { startColumn, endColumn } = (result[0] as any).range;
        expect(endColumn - startColumn).toBe("Nope".length);
    });

    it("lists known teams when the team does not exist and highlights just the team name", async () => {
        const result = await run(`a = ${variable}('[Alpha]\\Missing')`);
        expect(messages(result)).toEqual(["Team does not exist - expecting one of\n\n Core, UX"]);
        const { startColumn, endColumn } = (result[0] as any).range;
        expect(endColumn - startColumn).toBe("Missing".length);
    });
});

describe("VariableParametersChecker: general", () => {
    it("handles queries with no variables", async () => {
        expect(await run("a = 1")).toEqual([]);
    });

    it("collects errors from every variable in the query", async () => {
        const result = await run("a = @me('x') AND b = @today('y')");
        expect(messages(result)).toHaveLength(2);
    });
});
