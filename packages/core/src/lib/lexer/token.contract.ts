import { TokenType } from "./token-type.enum";

// [todo] rename file? it currently is the only one with ".contract" in its name.
export interface Token {
    type: TokenType;
    value: string;
}
