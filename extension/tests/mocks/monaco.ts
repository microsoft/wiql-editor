export class Position {
    constructor(public lineNumber: number, public column: number) { }
}

export class Range {
    constructor(
        public startLineNumber: number,
        public startColumn: number,
        public endLineNumber: number,
        public endColumn: number,
    ) { }
    public setEndPosition(endLineNumber: number, endColumn: number) {
        return new Range(this.startLineNumber, this.startColumn, endLineNumber, endColumn);
    }
}

export class Selection {
    constructor(
        public selectionStartLineNumber: number,
        public selectionStartColumn: number,
        public positionLineNumber: number,
        public positionColumn: number,
    ) { }
}

export const languages = {
    CompletionItemKind: { Variable: 4, Keyword: 17, Text: 18 },
};

export const editor = {};
