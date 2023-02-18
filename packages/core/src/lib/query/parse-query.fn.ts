import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { criteriaTokenParser } from "../criteria/parsing/criteria.token-parser";
import { lex } from "../lexer/lex.fn";
import { TokenType } from "../lexer/token-type.enum";
import { Token } from "../lexer/token.contract";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntityQueryTools } from "./entity-query-tools.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntityQueryPagingSort, QueryPaging } from "./query-paging";

export function parseQuery(
    factory: IEntityQueryTools,
    criteriaFactory: IEntityCriteriaTools,
    input: string,
    schemas: EntitySchemaCatalog
): IEntityQuery {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    const terminator: Token = { type: TokenType.Special, value: ";" };
    tokens.push(terminator);

    const parser = queryParser(criteriaFactory, terminator);
    parser.next();

    for (const token of tokens) {
        const result = parser.next(token);

        if (result.done) {
            if (result.value) {
                const parts = result.value;
                return factory.createQuery({
                    entitySchema: schemas.getSchema(parts.schemaName!),
                    options: parts.options,
                    criteria: parts.criteria,
                    selection: parts.selection,
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
    options?: ICriterion;
    criteria?: ICriterion;
    paging?: QueryPaging;
    selection?: UnpackedEntitySelection;
}

type QueryPartsParser = Generator<unknown, false | QueryParts, Token>;

function* queryParser(factory: IEntityCriteriaTools, terminator: Token): QueryPartsParser {
    let token = yield;

    if (token.type !== TokenType.Literal) {
        throw new Error("syntax error");
    }

    let parts: QueryParts = { schemaName: token.value };
    token = yield;

    if (token.type === TokenType.Special && token.value === "<") {
        const options = yield* criteriaTokenParser(factory, false, { type: TokenType.Special, value: ">" });

        if (!options) {
            return false;
        }

        parts = { ...parts, options: options() };
        token = yield;
    }

    if (token.type === TokenType.Special && token.value === "(") {
        const criteria = yield* criteriaTokenParser(factory, false, { type: TokenType.Special, value: ")" });

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

function* selectionParser(): Generator<unknown, false | UnpackedEntitySelection, Token> {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    let selection: UnpackedEntitySelection = {};

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
