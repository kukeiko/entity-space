import { scanNumber } from "./scan-number.fn";
import { scanString } from "./scan-string.fn";
import { scanSymbol } from "./scan-symbol.fn";
import { Token } from "./token";
import { TokenType } from "./token-type.enum";

const letterRegex = /[a-zA-Z]/;

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

        if ("(){}[]!:;,".includes(char)) {
            tokens.push({ type: TokenType.Special, value: char });
            next = iterator.next();
        } else if ('"'.includes(char)) {
            const [value, _next] = scanString(char, iterator);
            tokens.push({ type: TokenType.String, value });
            next = _next;
        } else if ("+-.0123456789".includes(char)) {
            const [value, _next] = scanNumber(char, iterator);

            if (value === ".") {
                tokens.push({ type: TokenType.Special, value });
            } else {
                tokens.push({ type: TokenType.Number, value });
            }

            next = _next;
        } else if ("|&".includes(char)) {
            tokens.push({ type: TokenType.Combinator, value: char });
            next = iterator.next();
        } else if (letterRegex.test(char)) {
            const [value, _next] = scanSymbol(char, iterator);
            tokens.push({ type: TokenType.Symbol, value });
            next = _next;
        } else if ("\n\t ".includes(char)) {
            // ignore
            next = iterator.next();
        } else {
            throw new Error(`unexpected character '${char}'`);
        }
    }

    return tokens;
}
