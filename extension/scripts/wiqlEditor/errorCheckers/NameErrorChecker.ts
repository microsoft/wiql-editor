import { CachedValue } from "../../cachedData/CachedValue";
import { fieldsVal } from "../../cachedData/fields";
import { IParseResults } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { definedVariables, lowerDefinedVariables } from "../wiqlDefinition";
import { decorationFromSym } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";
import * as monaco from 'monaco-editor';
export class NameErrorChecker implements IErrorChecker {
    private readonly validFieldIdentifiers: CachedValue<string[]> = new CachedValue(async () => {
        const fields = await fieldsVal.getValue();
        const validFieldIdentifiers: string[] = [];
        for (const field of fields.values) {
            validFieldIdentifiers.push(field.name.toLocaleLowerCase());
            validFieldIdentifiers.push(field.referenceName.toLocaleLowerCase());
        }
        return validFieldIdentifiers;
    });
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const validFieldIdentifiers = await this.validFieldIdentifiers.getValue();
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        // variable name errors
        const variables = symbolsOfType<Symbols.Variable>(parseResult, Symbols.Variable);
        for (const variable of variables) {
            if (!(variable.text.toLocaleLowerCase() in lowerDefinedVariables)) {
                errors.push(decorationFromSym(`Valid names are include {${Object.keys(definedVariables).join(", ")}}`, variable));
            }
        }
        // field name errors
        const identifiers = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
        for (const identifier of identifiers) {
            if (validFieldIdentifiers.indexOf(identifier.text.toLocaleLowerCase()) < 0) {
                errors.push(decorationFromSym("Field does not exist", identifier));
            }
        }
        return errors;
    }
}
