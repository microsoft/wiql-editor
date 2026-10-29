import { projectsVal } from "../../../scripts/cachedData/projects";
import { getTeams } from "../../../scripts/cachedData/teams";
import { getVariableParameterCompletions } from "../../../scripts/wiqlEditor/completion/variableArgumentCompletion";
import { completionContext, labels } from "../../helpers/completion";

jest.mock("../../../scripts/cachedData/projects", () => ({ __esModule: true, projectsVal: { getValue: jest.fn() } }));
jest.mock("../../../scripts/cachedData/teams", () => ({ __esModule: true, getTeams: jest.fn() }));

const Q = "SELECT a FROM workitems WHERE [Area Path] = ";
const complete = (suffix: string) => getVariableParameterCompletions(completionContext(Q + suffix));

beforeEach(() => {
    (projectsVal.getValue as jest.Mock).mockResolvedValue([{ name: "Alpha" }, { name: "Beta" }]);
    (getTeams as jest.Mock).mockResolvedValue([{ name: "Core" }, { name: "UX" }]);
});

describe("getVariableParameterCompletions", () => {
    it("returns nothing outside of variables", async () => {
        expect(await complete("")).toEqual([]);
    });

    it.each(["@currentiteration", "@teamareas"])("offers [project] names (quoted) right after %s(", async (variable) => {
        expect(labels(await complete(`${variable}(`))).toEqual(['"[Alpha]"', '"[Beta]"']);
    });

    it("offers unquoted [project] names once the string has been opened", async () => {
        expect(labels(await complete("@currentiteration('"))).toEqual(["[Alpha]", "[Beta]"]);
    });

    it("offers team names after the project", async () => {
        const result = await complete("@currentiteration('[Alpha]\\");
        expect(labels(result)).toEqual(["Core", "UX"]);
        expect(getTeams).toHaveBeenCalledWith("alpha");
    });

    it("matches the project case-insensitively", async () => {
        await complete("@teamareas('[BETA]\\");
        expect(getTeams).toHaveBeenCalledWith("beta");
    });

    it("offers nothing for an unknown project", async () => {
        expect(await complete("@currentiteration('[Nope]\\")).toEqual([]);
        expect(getTeams).not.toHaveBeenCalled();
    });

    it("offers nothing when the argument is not shaped like [project]\\team", async () => {
        expect(await complete("@currentiteration('abc")).toEqual([]);
    });

    it("offers nothing once an argument has been completed", async () => {
        expect(await complete("@currentiteration('[Alpha]\\Core',")).toEqual([]);
    });

    it("offers nothing for variables that take no team", async () => {
        expect(await complete("@today(")).toEqual([]);
    });
});
