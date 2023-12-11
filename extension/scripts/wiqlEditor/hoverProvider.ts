import { FieldType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

import { fieldsVal } from "../cachedData/fields";
import { getWitsByProjects } from "../cachedData/workItemTypes";
import { IParseResults, parse } from "./compiler/parser";
import * as Symbols from "./compiler/symbols";
import { symbolsAtPosition } from "./parseAnalysis/findSymbol";
import { getFilters } from "./parseAnalysis/whereClauses";
import { lowerDefinedVariables } from "./wiqlDefinition";
import * as monaco from 'monaco-editor';
function toRange(token: Symbols.Token) {
    return new monaco.Range(token.line + 1, token.startColumn + 1, token.line + 1, token.endColumn + 1);
}

async function getFieldHover(hoverSymbols: Symbols.Symbol[], parseResult: IParseResults): Promise<monaco.languages.Hover | null> {
    const id = hoverSymbols.filter((s) => s instanceof Symbols.Identifier)[0] as Symbols.Identifier;
    if (id) {
        const [fields, filters] = await Promise.all([fieldsVal.getValue(), getFilters(parseResult)]);
        const matchedField = fields.getField(id.text);
        if (matchedField) {
            const hovers: monaco.IMarkdownString[] = [];
            hovers.push({ value: `${matchedField.type}` });
            const range = toRange(id);
            // Also include description -- extensions can only get this from the work item types
            const workItemTypes = await getWitsByProjects(filters.projects, filters.workItemTypes);
            const descriptionSet: { [description: string]: void } = {};
            const descriptions: { [witName: string]: string } = {};
            for (const wit of workItemTypes) {
                for (const field of wit.fieldInstances) {
                    if (field.referenceName === matchedField.referenceName && field.helpText) {
                        descriptions[wit.name] = field.helpText;
                        descriptionSet[field.helpText] = void 0;
                    }
                }
            }
            const descriptionArr = Object.keys(descriptionSet);
            // Don't show the description if it differs by wit
            if (descriptionArr.length === 1) {
                hovers.push({ value: descriptionArr[0] });
            }
            return { contents: hovers, range };
        }
    }
    return null;
}

function getVariableHover(hoverSymbols: Symbols.Symbol[]): monaco.languages.Hover | undefined {
    const variable = hoverSymbols.filter((s) => s instanceof Symbols.VariableExpression)[0] as Symbols.VariableExpression;
    if (variable) {
        const matchedVariable = variable.name.text.toLocaleLowerCase() in lowerDefinedVariables;
        if (matchedVariable) {
            const hovers: monaco.IMarkdownString[] = [];
            hovers.push({ value: FieldType[lowerDefinedVariables[variable.name.text.toLocaleLowerCase()]] });
            const range = toRange(variable.name);
            return { contents: hovers, range };
        }
    }
}

async function getWitHover(hoverSymbols: Symbols.Symbol[], parseResult: IParseResults): Promise<monaco.languages.Hover | null> {
    const witExpression = hoverSymbols.filter((s) =>
        s instanceof Symbols.ConditionalExpression &&
        s.field &&
        (
            s.field.identifier.text.toLocaleLowerCase() === "system.workitemtype" ||
            s.field.identifier.text.toLocaleLowerCase() === "work item type"
        ),
    )[0] as Symbols.ConditionalExpression;
    const firstSymbol = hoverSymbols[0];
    if (
        firstSymbol instanceof Symbols.String &&
        witExpression
    ) {
        const witText = firstSymbol.text;
        // "Type" => Type
        const searchWit = witText.substr(1, witText.length - 2);
        const filters = await getFilters(parseResult);
        const workItemTypes = await getWitsByProjects(filters.projects, filters.workItemTypes);
        const matchingWits = workItemTypes.filter((w) => w.name.toLocaleLowerCase() === searchWit.toLocaleLowerCase());
        if (matchingWits.length !== 1) {
            return null;
        }
        const hovers: monaco.IMarkdownString[] = [];
        hovers.push({ value: `${matchingWits[0].description}` });
        return { contents: hovers, range: toRange(firstSymbol) };
    }
    return null;
}

export function getHoverProvider(): monaco.languages.HoverProvider {
    return {
        provideHover: async (model, position) => {
            const lines = model.getLinesContent();

            const parseResult = parse(lines);
            const hoverSymbols = symbolsAtPosition(position.lineNumber, position.column, parseResult);

            return await getFieldHover(hoverSymbols, parseResult) ||
                await getVariableHover(hoverSymbols) ||
                await getWitHover(hoverSymbols, parseResult) ||
                null;
        },
    };
}
