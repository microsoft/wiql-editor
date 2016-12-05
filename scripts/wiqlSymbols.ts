export abstract class Symbol { }
/** symbols generated by the lexer */
export abstract class Token extends Symbol {
    // include line and column numbers for better debugging.
    constructor(readonly line: number, readonly startColumn: number, readonly endColumn) {
        super();
    }
}
// Keywords
export class Select extends Token { }
export class From extends Token { }
export class Where extends Token { }
export class Order extends Token { }
export class By extends Token { }
export class Asc extends Token { }
export class Desc extends Token { }
export class Asof extends Token { }
export class Not extends Token { }
export class Ever extends Token { }
export class In extends Token { }
export class Like extends Token { }
export class Under extends Token { }
export class WorkItems extends Token { }
export class WorkItemLinks extends Token { }
export class And extends Token { }
export class Or extends Token { }
export class Contains extends Token { }
export class Words extends Token { }
export class Group extends Token { }
export class True extends Token { }
export class False extends Token { }
// Operators
export class RParen extends Token { }
export class LParen extends Token { }
export class RSqBracket extends Token { }
export class LSqBracket extends Token { }
export class Comma extends Token { }
export class Equals extends Token { }
export class NotEquals extends Token { }
export class GreaterThan extends Token { }
export class LessThan extends Token { }
export class GreaterOrEq extends Token { }
export class LessOrEq extends Token { }
export class Minus extends Token { }
export class Plus extends Token { }

export class UnexpectedToken extends Token {
    public readonly value: string;
    constructor(line: number, column: number, value: string) {
        super(line, column, column + value.length);
        this.value = value;
    }
}
export class String extends Token {
    public readonly value: string;
    constructor(line: number, column: number, value: string) {
        super(line, column, column + value.length);
        this.value = value;
    }
}
export class NonterminatingString extends Token {
    public readonly value: string;
    constructor(line: number, column: number, value: string) {
        super(line, column, column + value.length);
        this.value = value;
    }
}
export class Identifier extends Token {
    constructor(line: number, column: number, readonly value: string) {
        super(line, column, column + value.length);
        this.value = value;
    }
}
export class Digits extends Token {
    constructor(line: number, column: number, readonly numberString: string) {
        super(line, column, column + numberString.length);
    }
}
export class Variable extends Token {
    constructor(line: number, column: number, readonly name: string) {
        super(line, column, column + name.length);
    }
}
export class EOF extends Token {
    constructor(line: number, column: number, readonly prev: Token) {
        super(line, column, column + 1);
    }
}

export class Number extends Symbol {
    constructor(readonly digits: Digits, readonly minus?: Minus) {
        super();
    }
}
export class Field extends Symbol {
    constructor(readonly identifier: Identifier) {
        super();
    }
}
export class ContainsWords extends Symbol {
    constructor(readonly contains: Contains, readonly words: Words) {
        super();
    }
}
export class InGroup extends Symbol {
    constructor(readonly inToken: In, readonly group: Group) {
        super();
    }
 }
export class DateTime extends Symbol {
    constructor(readonly dateString: String) {
        super();
    }
}
export class OrderByFieldList extends Symbol {
    constructor(readonly field: Field,
                readonly ascDesc?: Asc | Desc,
                readonly restOfList?: OrderByFieldList) {
        super();
    }
}
export class FieldList extends Symbol {
    constructor(readonly field: Field, readonly restOfList?: FieldList) {
        super();
    }
}
export class ConditionalOperator extends Symbol {
    constructor(conditionToken: Equals);
    constructor(conditionToken: NotEquals);
    constructor(conditionToken: GreaterThan);
    constructor(conditionToken: GreaterOrEq);
    constructor(conditionToken: LessThan);
    constructor(conditionToken: LessOrEq);
    constructor(conditionToken: Contains, empty?: undefined, not?: Not);
    constructor(conditionToken: ContainsWords, empty?: undefined, not?: Not);
    constructor(conditionToken: InGroup, empty?: undefined, not?: Not);
    constructor(conditionToken: Like | Under, ever?: Ever, not?: Not);
    constructor(readonly conditionToken: Equals | NotEquals | GreaterThan | GreaterOrEq | LessThan | LessOrEq | Contains | ContainsWords | Like | Under | InGroup,
                readonly ever?: Ever, readonly not?: Not) {
        super();
    }
}
export class Value extends Symbol {
    constructor(value: Number);
    constructor(value: String);
    constructor(value: DateTime);
    constructor(value: Variable);
    constructor(value: Variable, operator: Plus | Minus, num: Number);
    constructor(value: True);
    constructor(value: False);
    constructor(value: Field);
    constructor(readonly value: Number | String | DateTime | Variable | True | False | Field,
                readonly operator?: Plus | Minus,
                readonly num?: Number) {
        super();
    }
}
export class ValueList extends Symbol {
    constructor(readonly value: Value, readonly restOfList?: ValueList) {
        super();
    }
}
/** Combines the expression[1 - 4] from ebnf into one */
export class LogicalExpression extends Symbol {
    constructor(condition: ConditionalExpression);
    constructor(condition: ConditionalExpression, blank: undefined, or: Or, expression: LogicalExpression);
    constructor(condition: ConditionalExpression, blank: undefined, and: And, expression: LogicalExpression);
    constructor(condition: ConditionalExpression, not: Not);
    constructor(condition: ConditionalExpression, not: Not, or: Or, expression: LogicalExpression);
    constructor(condition: ConditionalExpression, not: Not, and: And, expression: LogicalExpression);
    constructor(condition: ConditionalExpression, ever: Ever);
    constructor(condition: ConditionalExpression, ever: Ever, or: Or, expression: LogicalExpression);
    constructor(condition: ConditionalExpression, ever: Ever, and: And, expression: LogicalExpression);
    constructor(readonly condition: ConditionalExpression,
                readonly everNot?: Ever | Not,
                readonly orAnd?: Or | And,
                readonly expression?: LogicalExpression) {
        super();
    }
}
export class ConditionalExpression extends Symbol {
    public readonly expression?: LogicalExpression;

    public readonly field?: Field;

    public readonly conditionalOperator?: ConditionalOperator;
    public readonly value?: Value;

    public readonly not?: Not;
    public readonly valueList?: ValueList;
    constructor(expression: LogicalExpression);
    constructor(field: Field, cond: ConditionalOperator, value: Value);
    constructor(field: Field, not: Not | undefined, value: ValueList);
    constructor(arg1: Field | LogicalExpression, arg2?: ConditionalOperator | Not, arg3?: Value | ValueList) {
        super();
        if (arg1 instanceof LogicalExpression) {
            this.expression = arg1;
        } else if (arg2 instanceof ConditionalOperator && arg3 instanceof Value) {
            this.field = arg1;
            this.conditionalOperator = arg2;
            this.value = arg3;
            let a: number;
        } else if ((arg2 instanceof Not || arg2 === undefined) && arg3 instanceof ValueList) {
            this.field = arg1;
            this.not = <Not | undefined>arg2;
            this.valueList = arg3;
        } else {
            throw new Error('Improper ConditionalExpression arguments');
        }
    }
}
export class FlatSelect extends Symbol {
    constructor(readonly fieldList: FieldList,
                readonly whereExp?: LogicalExpression,
                readonly orderBy?: OrderByFieldList,
                readonly asOf?: DateTime) {
        super();
    }
}
// Link symbols not copied as workItemLink queries are not supported yet

export function getSymbolName(symbolClass: Function): string {
    const str: string = symbolClass.toString();
    const match = str.match(/function (\S+)(?=\()/);
    if (match) {
        return match[1].toUpperCase();
    }
    throw new Error('type is not a function');
}
export function isTokenClass(symbolClass: Function): boolean {
    return symbolClass.prototype.__proto__.constructor === Token;
}
