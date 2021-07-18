import { inRange, InRangeCriterion } from "../../value-criterion";
import { Token } from "../token";
import { TokenType } from "../token-type.enum";
import { TokenParser } from "./token-parser";

export class InRangeTokenParser implements TokenParser<InRangeCriterion<any>> {
    private fromInclusive?: boolean;
    private toInclusive?: boolean;
    private fromValue?: string | number;
    private toValue?: string | number;
    private expectingToValue = false;
    private valueType?: typeof Number | typeof String;

    accept(token: Token): boolean {
        if (this.fromInclusive === void 0) {
            if (token.type === TokenType.Special && "([".includes(token.value)) {
                this.fromInclusive = token.value === "[";
                return true;
            }
        } else if (this.fromValue === void 0) {
            if (token.type === TokenType.String) {
                this.fromValue = token.value;
                this.valueType = String;
                return true;
            } else if (token.type === TokenType.Number) {
                if (token.value === "...") {
                    this.fromValue = "...";
                } else {
                    this.fromValue = parseFloat(token.value);
                    this.valueType = Number;
                }

                return true;
            }
        } else if (this.toValue === void 0) {
            if (token.type === TokenType.Special && ")]".includes(token.value) && !this.expectingToValue) {
                this.toInclusive = token.value === "]";
                return true;
            } else if (token.type === TokenType.Special && token.value === ",") {
                this.expectingToValue = true;
                return true;
            } else if (token.type === TokenType.String && (this.valueType === String || this.fromValue === "...")) {
                this.toValue = token.value;
                this.valueType = String;
                return true;
            } else if ((token.type === TokenType.Number && this.valueType === Number) || this.fromValue === "...") {
                if (token.value === "...") {
                    this.toValue = "...";
                } else {
                    this.toValue = parseFloat(token.value);
                    this.valueType = Number;
                }

                return true;
            }
        } else if (this.toInclusive === void 0) {
            if (token.type === TokenType.Special && ")]".includes(token.value)) {
                this.toInclusive = token.value === "]";
                return true;
            }
        }

        return false;
    }

    isComplete(): boolean {
        return this.fromInclusive !== void 0 && this.fromValue !== void 0 && this.toInclusive !== void 0;
    }

    // [todo] remove as any hacks
    getResult(): InRangeCriterion<any> {
        const from = this.fromValue === "..." ? void 0 : this.fromValue;
        const to = this.toValue === "..." ? void 0 : this.toValue;

        return inRange(from as any, to as any, [this.fromInclusive, this.toInclusive] as any);
    }
}
