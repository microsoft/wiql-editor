import { FieldLookup } from "../../../scripts/cachedData/fields";
import { field, sampleFields } from "../../helpers/fixtures";
import { freshApi } from "../../helpers/restClients";

describe("FieldLookup", () => {
    const lookup = new FieldLookup(sampleFields());

    it("finds fields by reference name or display name, ignoring case", () => {
        expect(lookup.getField("System.Title")!.name).toBe("Title");
        expect(lookup.getField("system.title")).toBe(lookup.getField("TITLE"));
        expect(lookup.getField("Work Item Type")!.referenceName).toBe("System.WorkItemType");
    });

    it("returns undefined for unknown fields", () => {
        expect(lookup.getField("nope")).toBeUndefined();
    });

    it("exposes the raw field values", () => {
        expect(lookup.values).toHaveLength(sampleFields().length);
    });

    it("gives each lookup a unique id", () => {
        expect(new FieldLookup([]).lookupId).not.toBe(new FieldLookup([]).lookupId);
    });

    describe("equalFields", () => {
        it("is true for the reference name and display name of the same field", () => {
            expect(lookup.equalFields("System.AreaPath", "area path")).toBe(true);
        });

        it("is false for different fields", () => {
            expect(lookup.equalFields("System.Title", "System.State")).toBe(false);
        });

        it("is false if either field is unknown", () => {
            expect(lookup.equalFields("System.Title", "nope")).toBe(false);
            expect(lookup.equalFields("nope", "System.Title")).toBe(false);
            expect(lookup.equalFields("nope", "nope")).toBe(false);
        });
    });

    it("lets the later field win when names collide", () => {
        const dup = new FieldLookup([field("Dup", "A.One", 0), field("Dup", "B.Two", 0)]);
        expect(dup.getField("dup")!.referenceName).toBe("B.Two");
    });
});

describe("fieldsVal", () => {
    it("fetches fields with extension fields on current servers (getFields takes 2 args)", async () => {
        const api = freshApi();
        const calls: any[][] = [];
        const witClient = { getFields: function (_project?: any, _expand?: any) { calls.push([_project, _expand]); return Promise.resolve(sampleFields()); } };
        api.useClients(witClient);
        const { fieldsVal } = require("../../../scripts/cachedData/fields");

        const lookup = await fieldsVal.getValue();
        expect(calls).toEqual([[undefined, api.GetFieldsExpand.ExtensionFields]]);
        expect(lookup.getField("System.Id")).toBeDefined();
    });

    it("falls back to the single-argument signature on older servers", async () => {
        const api = freshApi();
        const calls: any[][] = [];
        const witClient = { getFields: function (_expand?: any) { calls.push([_expand]); return Promise.resolve(sampleFields()); } };
        api.useClients(witClient);
        const { fieldsVal } = require("../../../scripts/cachedData/fields");

        await fieldsVal.getValue();
        expect(calls).toEqual([[api.GetFieldsExpand.ExtensionFields]]);
    });

    it("caches the lookup", async () => {
        const api = freshApi();
        const getFields = jest.fn(async () => sampleFields());
        api.useClients({ getFields });
        const { fieldsVal } = require("../../../scripts/cachedData/fields");

        expect(fieldsVal.isLoaded()).toBe(false);
        const first = await fieldsVal.getValue();
        const second = await fieldsVal.getValue();
        expect(first).toBe(second);
        expect(getFields).toHaveBeenCalledTimes(1);
        expect(fieldsVal.isLoaded()).toBe(true);
    });
});
