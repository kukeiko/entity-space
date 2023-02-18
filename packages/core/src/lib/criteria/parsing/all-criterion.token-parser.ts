import { TokenType } from "../../lexer/token-type.enum";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { CriterionTokenParser } from "./criterion-token-parser.type";

export function* allCriterionTokenParser(tools: IEntityCriteriaTools): CriterionTokenParser {
    let token = yield;

    if (token.type === TokenType.Literal && token.value === "all") {
        return () => tools.all();
    }

    return false;
}
