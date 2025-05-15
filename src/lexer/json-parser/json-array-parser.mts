import { Json } from "@entity-space/utils";
import { parallelParser } from "../parallel-parser.mjs";
import { jsonParser } from "./json-parser.mjs";
import { JsonParser } from "./json-parser.type.mjs";
import { TokenType } from "../token.mjs";

export function* jsonArrayParser(): JsonParser {
    let token = yield;

    if (token.type !== TokenType.Special || token.value !== "[") {
        return false;
    }

    const createItems: (() => Json)[] = [];

    while (true) {
        const emptyArray: [] = [];

        const closeEmptyArray = function* (): JsonParser {
            let token = yield;

            if (token.type === TokenType.Special && token.value === "]") {
                return () => emptyArray;
            }

            return false;
        };

        const item = yield* parallelParser([jsonParser, closeEmptyArray]) as JsonParser;

        if (item !== false && item() === emptyArray) {
            if (createItems.length) {
                throw new Error("array closed too early");
            }

            return () => emptyArray;
        } else if (item === false) {
            return false;
        }

        createItems.push(item);
        token = yield;

        if (token.type === TokenType.Special && token.value === "]") {
            return () => createItems.map(createItem => createItem());
        } else if (token.type !== TokenType.Special || token.value !== ",") {
            return false;
        }
    }
}
