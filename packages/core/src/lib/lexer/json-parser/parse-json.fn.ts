import { Json } from "@entity-space/utils";
import { lex } from "../lex.fn";
import { jsonParser } from "./json-parser";

export function parseJson(json: string): Json {
    let tokens = lex(json);

    if (!tokens.length) {
        throw new Error("no tokens provided");
    }

    const parser = jsonParser();
    parser.next();

    for (const token of tokens) {
        const result = parser.next(token);

        if (result.done) {
            if (result.value) {
                return result.value();
            } else {
                throw new Error("syntax error");
            }
        }
    }

    throw new Error("syntax error");
}
