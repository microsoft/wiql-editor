import { FieldLookup } from "../../../scripts/cachedData/fields";
import { field, sampleFields } from "../../helpers/fixtures";
import { freshApi } from "../../helpers/restClients";

describe("isIdentityField", () => {
    const { isIdentityField } = require("../../../scripts/cachedData/identities");
    const fields = new FieldLookup([
        ...sampleFields(),
        field("Custom Person", "Custom.Person", 0, { isIdentity: true }),
        field("Custom Text", "Custom.Text", 0, { isIdentity: false }),
        field("Activated By", "Microsoft.VSTS.Common.ActivatedBy", 0),
    ]);

    it("recognises well-known system identity fields", () => {
        expect(isIdentityField(fields, "System.AssignedTo")).toBe(true);
        expect(isIdentityField(fields, "Microsoft.VSTS.Common.ActivatedBy")).toBe(true);
        expect(isIdentityField(fields, "Activated By")).toBe(true);
    });

    it("trusts the server's isIdentity flag for custom fields", () => {
        expect(isIdentityField(fields, "Custom.Person")).toBe(true);
        expect(isIdentityField(fields, "Custom.Text")).toBe(false);
    });

    it("is false for ordinary fields", () => {
        expect(isIdentityField(fields, "System.Title")).toBe(false);
    });

    it("is false for unknown fields", () => {
        expect(isIdentityField(fields, "Nope")).toBe(false);
        expect(isIdentityField(fields, "")).toBe(false);
    });
});

describe("identitiesVal", () => {
    it("formats users as 'Display Name <unique name>' and groups by display name only", async () => {
        freshApi();
        jest.doMock("../../../scripts/cachedData/identities/getIdentities", () => ({
            getIdentities: jest.fn(async () => [
                { displayName: "Ada Lovelace", uniqueName: "ada@example.com", isContainer: false },
                { displayName: "[Proj]\\Team", uniqueName: "ignored", isContainer: true },
            ]),
        }));
        const { identitiesVal } = require("../../../scripts/cachedData/identities");

        expect(await identitiesVal.getValue()).toEqual(["Ada Lovelace <ada@example.com>", "[Proj]\\Team"]);
    });
});
