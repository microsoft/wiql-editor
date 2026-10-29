import { FieldType } from "azure-devops-extension-api/WorkItemTracking";
import { conf, def, definedVariables, language, lowerDefinedVariables } from "../../scripts/wiqlEditor/wiqlDefinition";

describe("definedVariables", () => {
    it("maps each variable to the field type it produces", () => {
        expect(definedVariables["@me"]).toBe(FieldType.String);
        expect(definedVariables["@today"]).toBe(FieldType.DateTime);
        expect(definedVariables["@currentiteration"]).toBe(FieldType.TreePath);
        expect(definedVariables["@teamareas"]).toBe(FieldType.TreePath);
        expect(definedVariables["@project"]).toBe(FieldType.String);
        expect(definedVariables["@follows"]).toBe(FieldType.Integer);
        expect(definedVariables["[any]"]).toBe(FieldType.String);
    });

    it("builds a lower-case lookup with the same entries", () => {
        expect(Object.keys(lowerDefinedVariables)).toHaveLength(Object.keys(definedVariables).length);
        expect(lowerDefinedVariables["@recentmentions"]).toBe(FieldType.Integer);
        expect(lowerDefinedVariables["@RecentMentions"]).toBeUndefined();
    });
});

describe("language definition", () => {
    it("registers the wiql language", () => {
        expect(def.id).toBe("wiql");
        expect(def.extensions).toContain(".wiql");
    });

    it("configures bracket auto-closing that is disabled inside strings", () => {
        expect(conf.brackets).toEqual([["[", "]"], ["(", ")"]]);
        for (const pair of conf.autoClosingPairs!) {
            expect((pair as any).notIn).toContain("string");
        }
    });

    it("declares the core keywords and operators for syntax highlighting", () => {
        expect((language as any).keywords).toEqual(expect.arrayContaining(["select", "from", "where", "order", "by", "asof"]));
        expect((language as any).operators).toEqual(expect.arrayContaining(["=", "<>", "<=", ">="]));
        expect(language.ignoreCase).toBe(true);
    });

    it("has a tokenizer state for every state it transitions to", () => {
        const states = Object.keys(language.tokenizer);
        const targets: string[] = [];
        JSON.stringify(language.tokenizer, (_k, v) => {
            if (v && typeof v === "object" && typeof v.next === "string" && v.next !== "@pop") {
                targets.push(v.next.replace("@", ""));
            }
            return v;
        });
        for (const target of targets) {
            expect(states).toContain(target);
        }
    });
});
