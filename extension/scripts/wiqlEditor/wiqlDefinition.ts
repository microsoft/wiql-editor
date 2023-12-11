import { FieldType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import * as monaco from 'monaco-editor';
export const definedVariables: {[name: string]: FieldType} = {
    "@me": FieldType.String,
    "@currentiteration": FieldType.TreePath,
    "@teamareas": FieldType.TreePath,
    "@project": FieldType.String,
    "@today": FieldType.DateTime,
    "@follows": FieldType.Integer,
    "@RecentMentions": FieldType.Integer,
    "[any]": FieldType.String,
};
export const lowerDefinedVariables: {[lowerName: string]: FieldType} = Object.keys(definedVariables)
.reduce((arr, val) => {arr[val.toLocaleLowerCase()] = definedVariables[val]; return arr; }, {} as {[lowerName: string]: FieldType});

export const def: monaco.languages.ILanguageExtensionPoint = {
    id: "wiql",
    extensions: [".wiql"],
    aliases: ["WIQL"],
};

export const conf: monaco.languages.LanguageConfiguration = {
    brackets: [["[", "]"], ["(", ")"]],
    autoClosingPairs: [
        { open: `"`, close: `"`, notIn: ["string"] },
        { open: "'", close: "'", notIn: ["string"] },
        { open: "\"", close: "\"", notIn: ["string"] },
        { open: "[", close: "]", notIn: ["string"] },
        { open: "(", close: ")", notIn: ["string"] },
    ],
};

export const language = <monaco.languages.IMonarchLanguage> {
    ignoreCase: true,
    tokenPostfix: ".wiql",

    keywords: ["select", "from", "where", "order", "by", "asc", "desc", "asof", "not", "ever", "in", "like", "under", "and", "or", "contains", "words", "group", "mode"],
    operators: ["=", "<>", "<=", ">=", "<", ">", ",", "ever", "not", "like", "under", "in", "like", "under"],

    brackets: [
        { open: "[", close: "]", token: "delimiter.square" },
        { open: "(", close: ")", token: "delimiter.parenthesis" },
    ],
    tokenizer: {
        root: [
            [/[a-z_]\w*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
            [/[ \t\r\n]+/, "white"],
            { include: "@strings" },
            [/\[/, { token: "bracket.square", bracket: "@open", next: "@bracketedIdentifier" }],
            [/[()[\]]/, "@brackets"],
            { include: "@number" },
        ],
        bracketedIdentifier: [
            [/[^\]]+/, "identifier"],
            [/\]/, { token: "bracket.square", bracket: "@close", next: "@pop" }],
        ],
        strings: [
            [/"/, { token: "string.quote", bracket: "@open", next: "@string1" }],
            [/'/, { token: "string.quote", bracket: "@open", next: "@string2" }],
        ],
        string1: [
            [/[^"]+/, "string"],
            [/""/, "string"],
            [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
        ],
        string2: [
            [/[^']+/, "string"],
            [/''/, "string"],
            [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
        ],
        number: [
            [/-?\d+(?:\.\d*)(?:e-?\d+)?/, "number.float"],
            [/-?\d+(?:\.\d*)?(?:e-?\d+)/, "number.float"],
            [/-?\d+?/, "number"],
        ],
    },
};
