import { IParseResults } from "../compiler/parser";
import * as monaco from 'monaco-editor';
export interface IErrorChecker {
    check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]>;
}
