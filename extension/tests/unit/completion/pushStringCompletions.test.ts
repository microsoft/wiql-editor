import { ParseError } from "../../../scripts/wiqlEditor/compiler/parser";
import * as Symbols from "../../../scripts/wiqlEditor/compiler/symbols";
import { pushStringCompletions } from "../../../scripts/wiqlEditor/completion/pushStringCompletions";
import { labels } from "../../helpers/completion";

const ctxWithErrorToken = (token: Symbols.Token) => ({ parseNext: new ParseError([], token, [], []) }) as any;
const eof = () => ctxWithErrorToken(new Symbols.EOF(0, 0, undefined as any));
const unfinishedString = (text: string) => ctxWithErrorToken(new Symbols.NonterminatingString(0, 0, text));

describe("pushStringCompletions", () => {
    it("quotes values when not inside a string", () => {
        const result = pushStringCompletions(eof(), ["Bug", "Task"], []);
        expect(labels(result)).toEqual(['"Bug"', '"Task"']);
        expect(result[0].kind).toBe(18);
    });

    it("leaves values unquoted when the user is already inside a string", () => {
        const result = pushStringCompletions(unfinishedString("'"), ["Bug"], []);
        expect(labels(result)).toEqual(["Bug"]);
    });

    it("appends to the supplied completions array", () => {
        const existing: any[] = [{ label: "existing" }];
        const result = pushStringCompletions(eof(), ["x"], existing);
        expect(result).toBe(existing);
        expect(labels(result)).toEqual(["existing", '"x"']);
    });

    it("returns an empty list when there is nothing to complete", () => {
        expect(pushStringCompletions(eof(), [], [])).toEqual([]);
    });

    it("keeps every value when the typed text has no path delimiter", () => {
        const result = pushStringCompletions(unfinishedString("'Pro"), ["Proj", "Other"], []);
        expect(labels(result)).toEqual(["Proj", "Other"]);
        expect(result[0]).not.toHaveProperty("insertText");
    });

    it("narrows to the typed prefix and inserts only the part after the last delimiter", () => {
        const values = ["Proj\\Sprint 1", "Proj\\Sprint 2", "Other\\Sprint 1"];
        const result = pushStringCompletions(unfinishedString("'Proj\\"), values, []);
        expect(labels(result)).toEqual(["Proj\\Sprint 1", "Proj\\Sprint 2"]);
        expect(result.map((r) => r.insertText)).toEqual(["Sprint 1", "Sprint 2"]);
    });

    it.each([".", " ", "-", ":", "<", ">"])("treats '%s' as a delimiter", (delimiter) => {
        const values = [`a${delimiter}one`, `b${delimiter}two`];
        const result = pushStringCompletions(unfinishedString(`'a${delimiter}`), values, []);
        expect(labels(result)).toEqual([`a${delimiter}one`]);
        expect(result[0].insertText).toBe("one");
    });

    it("matches the typed prefix case-insensitively", () => {
        const result = pushStringCompletions(unfinishedString("'proj\\"), ["Proj\\A"], []);
        expect(labels(result)).toEqual(["Proj\\A"]);
    });
});
