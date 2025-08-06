import { Token, TokenType } from "@entity-space/lexer";
import { EntitySelection } from "./entity-selection";

export function* selectionParser(
    parentSelection?: EntitySelection,
): Generator<unknown, false | EntitySelection, Token> {
    let token = yield;

    if (token.type !== TokenType.Special) {
        return false;
    } else if (token.value === "*") {
        if (parentSelection === undefined) {
            return false;
        }

        return parentSelection;
    } else if (token.value !== "{") {
        return false;
    }

    const selection: EntitySelection = {};

    while (true) {
        token = yield;
        let expectingName = false;

        if (token.type === TokenType.Special && token.value === ",") {
            if (!Object.keys(selection).length) {
                return false;
            }

            token = yield;
            expectingName = true;
        }

        if (token.type === TokenType.Special && token.value === "}") {
            if (expectingName) {
                return false;
            }

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
            const propertyValue = yield* selectionParser(selection);

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
