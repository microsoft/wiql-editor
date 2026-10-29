import { freshApi } from "../../helpers/restClients";

describe("relationTypes", () => {
    it("loads relation types from the work item tracking client once", async () => {
        const api = freshApi();
        const types = [{ referenceName: "System.LinkTypes.Related", attributes: { usage: "workItemLink" } }];
        const getRelationTypes = jest.fn(async () => types);
        api.useClients({ getRelationTypes });
        const { relationTypes } = require("../../../scripts/cachedData/relationTypes");

        expect(await relationTypes.getValue()).toBe(types);
        await relationTypes.getValue();
        expect(getRelationTypes).toHaveBeenCalledTimes(1);
    });
});
