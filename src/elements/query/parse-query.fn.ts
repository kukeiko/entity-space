import { jsonParser, lex, Token, TokenType } from "@entity-space/lexer";
import { isPlainObject } from "lodash";
import { Criterion } from "../criteria/criterion";
import { criteriaTokenParser } from "../criteria/parse/criteria.token-parser";
import { Entity } from "../entity/entity";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { EntitySelection } from "../selection/entity-selection";
import { selectionParser } from "../selection/selection-parser.fn";
import { unpackSelection } from "../selection/unpack-selection.fn";
import { EntityQuery } from "./entity-query";
import { EntityQueryParameters } from "./entity-query-parameters";

export function parseQuery(input: string, schemas: EntitySchemaCatalog): EntityQuery {
    const tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    const terminator: Token = { type: TokenType.Special, value: ";" };
    tokens.push(terminator);

    const parser = queryParser(terminator);
    parser.next();

    for (const token of tokens) {
        const result = parser.next(token);

        if (result.done) {
            if (result.value) {
                const parts = result.value;
                const schema = schemas.getSchema(parts.schemaName!);
                let parameters: EntityQueryParameters | undefined;

                if (parts.parametersSchemaName && parts.parameters) {
                    parameters = new EntityQueryParameters(
                        schemas.getSchema(parts.parametersSchemaName),
                        parts.parameters,
                    );
                }

                return new EntityQuery(
                    schema,
                    unpackSelection(schema, parts.selection ?? {}),
                    parts.criterion,
                    parameters,
                );
            } else {
                throw new Error("syntax error");
            }
        }
    }

    throw new Error("syntax error");
}

interface QueryParts {
    schemaName?: string;
    criterion?: Criterion;
    selection?: EntitySelection;
    parametersSchemaName?: string;
    parameters?: Entity;
}

type QueryPartsParser = Generator<unknown, false | QueryParts, Token>;

function* queryParser(terminator: Token): QueryPartsParser {
    let token = yield;

    if (token.type !== TokenType.Literal) {
        throw new Error("syntax error");
    }

    let parts: QueryParts = { schemaName: token.value };
    token = yield;

    if (token.type === TokenType.Special && token.value === "<") {
        token = yield;

        if (token.type !== TokenType.Literal) {
            throw new Error("syntax error");
        }

        parts.parametersSchemaName = token.value;
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ":") {
            throw new Error("syntax error");
        }

        const parameters = yield* jsonParser();

        if (!parameters) {
            return false;
        }

        token = yield;

        if (token.type !== TokenType.Special || token.value !== ">") {
            return false;
        }

        const json = parameters();

        if (!isPlainObject(json)) {
            throw new Error(`expected "parameters" to be a record`);
        }

        parts = { ...parts, parameters: json as Entity };
        token = yield;
    }

    if (token.type === TokenType.Special && token.value === "(") {
        const criteria = yield* criteriaTokenParser(false, { type: TokenType.Special, value: ")" });

        if (!criteria) {
            return false;
        }

        parts = { ...parts, criterion: criteria() };
        token = yield;
    }

    // if (token.type === TokenType.Special && token.value === "[") {
    //     const paging = yield* pagingParser();

    //     if (!paging) {
    //         return false;
    //     }

    //     parts = { ...parts, paging: paging };
    //     token = yield;
    // }

    if (token.type === TokenType.Special && token.value === "/") {
        const selection = yield* selectionParser();

        if (!selection) {
            return false;
        }

        parts = { ...parts, selection };
        token = yield;
    }

    if (token.type === terminator.type && token.value === terminator.value) {
        return parts;
    } else {
        return false;
    }
}
