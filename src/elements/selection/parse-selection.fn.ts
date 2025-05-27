import { lex } from "@entity-space/lexer";
import { EntitySelection } from "./entity-selection";
import { selectionParser } from "./selection-parser.fn";

export function parseSelection(input: string): EntitySelection {
    const tokens = lex(input);

    if (!tokens.length) {
        throw new Error("no tokens provided");
    }

    const parser = selectionParser();
    parser.next();

    for (const token of tokens) {
        const result = parser.next(token);

        if (result.done) {
            if (result.value) {
                return result.value;
            } else {
                throw new Error("syntax error");
            }
        }
    }

    throw new Error("syntax error");
}
