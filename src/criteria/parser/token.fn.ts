import { TokenType } from "./token-type.enum";
import { Token } from "./token.contract";

export function token(type: TokenType, value: string): Token {
    return { type, value };
}
