import { Token, TokenType } from "@entity-space/lexer";
import { EntitySelection } from "./entity-selection";

export function* selectionParser(): Generator<unknown, false | EntitySelection, Token> {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    let selection: EntitySelection = {};

    while (true) {
        token = yield;

        if (token.type === TokenType.Special && token.value === "}") {
            break;
        }

        if (token.type !== TokenType.Literal) {
            return false;
        }

        const propertyName = token.value;
        token = yield;

        if (token.type === TokenType.Special && token.value === ",") {
            selection[propertyName] = true;
        } else if (token.type === TokenType.Special && token.value === ":") {
            const propertyValue = yield* selectionParser();

            if (propertyValue === false) {
                return false;
            }

            selection[propertyName] = propertyValue;
        } else if (token.type === TokenType.Special && token.value === "}") {
            selection[propertyName] = true;
            break;
        } else {
            return false;
        }
    }

    return selection;
}
