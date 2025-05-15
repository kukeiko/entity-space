import { Json } from "@entity-space/utils";
import { jsonParser } from "./json-parser.mjs";
import { JsonParser } from "./json-parser.type.mjs";
import { TokenType } from "../token.mjs";

export function* jsonObjectParser(): JsonParser {
    let token = yield;

    if (token.type !== TokenType.Special || token.value !== "{") {
        return false;
    }

    const properties: Record<string, () => Json> = {};

    while (true) {
        token = yield;

        if (token.type === TokenType.Special && token.value === "}" && !Object.keys(properties).length) {
            return () => ({});
        } else if (token.type !== TokenType.String) {
            return false;
        }

        const key = token.value;
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ":") {
            return false;
        }

        const item = yield* jsonParser();

        if (item === false) {
            return false;
        }

        properties[key] = item;

        token = yield;

        if (token.type == TokenType.Special && token.value === "}") {
            return () => Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, value()]));
        } else if (token.type !== TokenType.Special || token.value !== ",") {
            return false;
        }
    }
}
