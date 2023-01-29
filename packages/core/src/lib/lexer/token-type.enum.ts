export enum TokenType {
    Number = 0,
    String = 1,
    // [todo] is there any reason to have this at all? why not just use "Special" instead?
    Combinator = 2,
    Literal = 3,
    Special = 4,
}
