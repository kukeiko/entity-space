import { TokenType } from "../../../lexer/token-type.enum";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { CriterionTokenParser } from "./criterion-token-parser.type";

export function* allCriterionTokenParser(factory: IEntityCriteriaFactory): CriterionTokenParser {
    let token = yield;

    if (token.type === TokenType.Literal && token.value === "all") {
        return () => factory.all();
    }

    return false;
}
