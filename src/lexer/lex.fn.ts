import { scanLiteral } from "./scan-literal.fn";
import { scanNumber } from "./scan-number.fn";
import { scanString } from "./scan-string.fn";
import { Token, token, TokenType } from "./token";

const literalStartRegex = /[a-zA-Z]/;

/**
 * big credits to andy balaam for providing nice info for lexing + parsing newbies such as myself
 * https://gitlab.com/cell_lang/cell
 * https://accu.org/journals/overload/26/145/balaam_2510/
 * https://accu.org/journals/overload/26/146/balaam_2532/
 */
export function lex(input: string): Token[] {
    const iterator = input[Symbol.iterator]();
    const tokens: Token[] = [];
    let next = iterator.next();

    while (!next.done) {
        const char = next.value;

        if ("(){}[]!:;,<>/*".includes(char)) {
            tokens.push(token(TokenType.Special, char));
            next = iterator.next();
        } else if ('"'.includes(char)) {
            const [value, _next] = scanString(char, iterator);
            tokens.push(token(TokenType.String, value));
            next = iterator.next();
        } else if ("+-.0123456789".includes(char)) {
            const [value, _next] = scanNumber(char, iterator);

            if (value === ".") {
                tokens.push(token(TokenType.Special, value));
            } else {
                tokens.push(token(TokenType.Number, value));
            }

            next = _next;
        } else if ("|&".includes(char)) {
            tokens.push(token(TokenType.Combinator, char));
            next = iterator.next();
        } else if (literalStartRegex.test(char)) {
            const [value, _next] = scanLiteral(char, iterator);
            tokens.push(token(TokenType.Literal, value));
            next = _next;
        } else if ("\n\t ".includes(char)) {
            // ignore
            next = iterator.next();
        } else {
            throw new Error(`unexpected character "${char}"`);
        }
    }

    return tokens;
}
