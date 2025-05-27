export enum TokenType {
    Number = 0,
    String = 1,
    Combinator = 2,
    Literal = 3,
    Special = 4,
}

export interface Token {
    type: TokenType;
    value: string;
}

export function token(type: TokenType, value: string): Token {
    return { type, value };
}
