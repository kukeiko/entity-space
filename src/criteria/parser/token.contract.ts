import { TokenType } from "./token-type.enum";

export interface Token {
    type: TokenType;
    value: string;
}
