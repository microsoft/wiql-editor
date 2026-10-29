import { ErrorChecker } from "../../scripts/wiqlEditor/errorCheckers/ErrorChecker";
import { installBackend } from "../helpers/fakeBackend";
import { parseQuery } from "../helpers/fixtures";

jest.mock("../../scripts/RestCall", () => ({ callApi: jest.fn() }));

describe("backend outages", () => {
    it("reject the diagnostics pass rather than silently reporting no errors", async () => {
        const { witClient } = installBackend();
        witClient.getFields = function (_a?: any, _b?: any) { return Promise.reject(new Error("503 Service Unavailable")); };

        await expect(new ErrorChecker().check(parseQuery("SELECT [System.Id] FROM workitems"))).rejects.toThrow("503");
    });

    it("do not affect the syntax checker, which needs no backend data", async () => {
        const { SyntaxErrorChecker } = require("../../scripts/wiqlEditor/errorCheckers/SyntaxErrorChecker");
        const result = await new SyntaxErrorChecker().check(parseQuery("SELECT FROM"));
        expect(result).toHaveLength(1);
    });
});
