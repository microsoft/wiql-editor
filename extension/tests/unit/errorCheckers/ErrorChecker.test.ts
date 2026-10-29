import { ErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/ErrorChecker";
import { AllowedValuesChecker } from "../../../scripts/wiqlEditor/errorCheckers/AllowedValuesChecker";
import { LinkTypeCountChecker } from "../../../scripts/wiqlEditor/errorCheckers/LinkTypeCountChecker";
import { NameErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/NameErrorChecker";
import { PrefixChecker } from "../../../scripts/wiqlEditor/errorCheckers/PrefixChecker";
import { SyntaxErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/SyntaxErrorChecker";
import { TypeErrorChecker } from "../../../scripts/wiqlEditor/errorCheckers/TypeErrorChecker";
import { VariableParametersChecker } from "../../../scripts/wiqlEditor/errorCheckers/VariableParametersChecker";
import { areaStrings, iterationStrings } from "../../../scripts/cachedData/nodes";
import { allTagsVal } from "../../../scripts/cachedData/tags";

// Each mock is spelled out because ts-jest only hoists literal jest.mock calls.
jest.mock("../../../scripts/wiqlEditor/errorCheckers/AllowedValuesChecker", () => ({ __esModule: true, AllowedValuesChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/wiqlEditor/errorCheckers/LinkTypeCountChecker", () => ({ __esModule: true, LinkTypeCountChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/wiqlEditor/errorCheckers/NameErrorChecker", () => ({ __esModule: true, NameErrorChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/wiqlEditor/errorCheckers/PrefixChecker", () => ({ __esModule: true, PrefixChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/wiqlEditor/errorCheckers/SyntaxErrorChecker", () => ({ __esModule: true, SyntaxErrorChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/wiqlEditor/errorCheckers/TypeErrorChecker", () => ({ __esModule: true, TypeErrorChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/wiqlEditor/errorCheckers/VariableParametersChecker", () => ({ __esModule: true, VariableParametersChecker: jest.fn(() => ({ check: jest.fn(async () => []) })) }));
jest.mock("../../../scripts/cachedData/nodes", () => ({ __esModule: true, areaStrings: { id: "area" }, iterationStrings: { id: "iteration" } }));
jest.mock("../../../scripts/cachedData/tags", () => ({ __esModule: true, allTagsVal: { id: "tags" } }));

const decoration = (message: string) => ({ range: {}, options: { hoverMessage: { value: message } } }) as any;

describe("ErrorChecker", () => {
    it("registers the standard checkers", () => {
        new ErrorChecker();
        for (const checker of [SyntaxErrorChecker, NameErrorChecker, TypeErrorChecker, PrefixChecker, LinkTypeCountChecker, VariableParametersChecker]) {
            expect(checker).toHaveBeenCalledTimes(1);
        }
    });

    it("validates iteration path, area path and tags against their cached values", () => {
        new ErrorChecker();
        expect((AllowedValuesChecker as jest.Mock).mock.calls).toEqual([
            ["System.IterationPath", "Iteration Path", iterationStrings],
            ["System.AreaPath", "Area Path", areaStrings],
            ["System.Tags", "Tags", allTagsVal],
        ]);
    });

    it("returns no errors when every checker is happy", async () => {
        expect(await new ErrorChecker().check({} as any)).toEqual([]);
    });

    it("runs every checker on the parse result and flattens their decorations in registration order", async () => {
        const checker = new ErrorChecker();
        const [syntax, name] = [SyntaxErrorChecker, NameErrorChecker].map((c) => (c as jest.Mock).mock.results[0].value.check as jest.Mock);
        syntax.mockResolvedValue([decoration("syntax 1"), decoration("syntax 2")]);
        name.mockResolvedValue([decoration("name")]);

        const parseResult = { parsed: true } as any;
        const errors = await checker.check(parseResult);

        expect(errors.map((e) => (e.options.hoverMessage as any).value)).toEqual(["syntax 1", "syntax 2", "name"]);
        expect(syntax).toHaveBeenCalledWith(parseResult);
        expect(name).toHaveBeenCalledWith(parseResult);
    });

    it("rejects if any checker fails", async () => {
        const checker = new ErrorChecker();
        const typeCheck = (TypeErrorChecker as jest.Mock).mock.results[0].value.check as jest.Mock;
        typeCheck.mockRejectedValue(new Error("fields unavailable"));
        await expect(checker.check({} as any)).rejects.toThrow("fields unavailable");
    });
});
