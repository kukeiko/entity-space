import { EntitySchemaCatalog, ExpansionValue } from "@entity-space/common";
import { criteriaTokenParser, Criterion, CriterionTokenParser, tokenParser } from "@entity-space/criteria";
import { lex, token, Token, TokenType } from "@entity-space/lexer";
import { Query } from "./query";
import { EntityQueryPagingSort, QueryPaging } from "./query-paging";

export function parseQuery(input: string, schemas: EntitySchemaCatalog): Query {
    let tokens = lex(input);

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
                return new Query({
                    entitySchema: schemas.getSchema(parts.schemaName!),
                    options: parts.options,
                    criteria: parts.criteria,
                    expansion: parts.expansion,
                    paging: parts.paging,
                });
            } else {
                throw new Error("syntax error");
            }
        }
    }

    throw new Error("syntax error");
}

interface QueryParts {
    schemaName?: string;
    options?: Criterion;
    criteria?: Criterion;
    paging?: QueryPaging;
    expansion?: ExpansionValue;
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
        const options = yield* criteriaTokenParser(false, { type: TokenType.Special, value: ">" });

        if (!options) {
            return false;
        }

        parts = { ...parts, options: options() };
        token = yield;
    }

    if (token.type === TokenType.Special && token.value === "(") {
        const criteria = yield* criteriaTokenParser(false, { type: TokenType.Special, value: ")" });

        if (!criteria) {
            return false;
        }

        parts = { ...parts, criteria: criteria() };
        token = yield;
    }

    if (token.type === TokenType.Special && token.value === "[") {
        const paging = yield* pagingParser();

        if (!paging) {
            return false;
        }

        parts = { ...parts, paging: paging };
        token = yield;
    }

    if (token.type === TokenType.Special && token.value === "/") {
        const expansion = yield* expansionParser();

        if (!expansion) {
            return false;
        }

        parts = { ...parts, expansion };
        token = yield;
    }

    if (token.type === terminator.type && token.value === terminator.value) {
        return parts;
    } else {
        return false;
    }
}

function* expansionParser(): Generator<unknown, false | ExpansionValue, Token> {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    let expansion: ExpansionValue = {};

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
            expansion[propertyName] = true;
        } else if (token.type === TokenType.Special && token.value === ":") {
            const propertyValue = yield* expansionParser();

            if (propertyValue === false) {
                return false;
            }

            expansion[propertyName] = propertyValue;
        } else if (token.type === TokenType.Special && token.value === "}") {
            expansion[propertyName] = true;
            break;
        } else {
            return false;
        }
    }

    return expansion;
}

function* pagingParser(): Generator<unknown, false | QueryPaging, Token> {
    const sort: EntityQueryPagingSort[] = [];
    let token = yield;

    while (true) {
        if (token.type === TokenType.Special && token.value === "!") {
            token = yield;

            if (token.type !== TokenType.Literal) {
                return false;
            }

            sort.push({ field: token.value, mode: "desc" });
            token = yield;
        } else if (token.type === TokenType.Literal) {
            sort.push({ field: token.value, mode: "asc" });
            token = yield;
        } else if (token.type === TokenType.Special && token.value === ",") {
            token = yield;
            continue;
        } else if (token.type === TokenType.Number) {
            break;
        } else if (token.type === TokenType.Special && token.value === ".") {
            break;
        } else {
            return false;
        }
    }

    let from: number | undefined;

    if (token.type === TokenType.Number) {
        from = +token.value;
    } else if (token.type === TokenType.Special && token.value === ".") {
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ".") return false;
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ".") return false;
    }

    token = yield;

    if (token.type !== TokenType.Special || token.value !== ",") {
        return false;
    }

    token = yield;

    let to: number | undefined;

    if (token.type === TokenType.Number) {
        to = +token.value;
    } else if (token.type === TokenType.Special && token.value === ".") {
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ".") return false;
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ".") return false;
    }

    token = yield;

    if (token.type !== TokenType.Special || token.value !== "]") {
        return false;
    }

    return new QueryPaging({ sort, from, to });
}