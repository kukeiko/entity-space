import { inSet, InSetCriterion, notInSet, NotInSetCriterion } from "../../value-criterion";
import { Token } from "../token";
import { TokenType } from "../token-type.enum";
import { TokenParser } from "./token-parser";

export class SetTokenParser implements TokenParser<InSetCriterion<any> | NotInSetCriterion<any>> {
    private isNegated = false;
    private isOpen = false;
    private isClosed = false;
    private items: string[] = [];
    private expectingCloseOrComma = false;

    accept(token: Token): boolean {
        if (!this.isOpen) {
            if (token.type === TokenType.Special && token.value === "{") {
                this.isOpen = true;
                return true;
            } else if (token.type === TokenType.Special && token.value === "!") {
                this.isNegated = true;
                return true;
            } else {
                return false;
            }
        }

        if ([TokenType.Number, TokenType.String].includes(token.type) && !this.expectingCloseOrComma) {
            this.items.push(token.value);
            this.expectingCloseOrComma = true;
            return true;
        } else if (token.type === TokenType.Special && token.value === "}" && this.expectingCloseOrComma) {
            this.isClosed = true;
            return true;
        } else if (token.type === TokenType.Special && token.value === "," && this.expectingCloseOrComma) {
            this.expectingCloseOrComma = false;
            return true;
        }

        return false;
    }

    isComplete(): boolean {
        return this.isClosed;
    }

    getResult(): InSetCriterion<any> | NotInSetCriterion<any> {
        const createSet = this.isNegated ? notInSet : inSet;

        if (!isNaN(parseFloat(this.items[0]))) {
            return createSet(this.items.map(item => parseFloat(item)));
        } else {
            return createSet(this.items);
        }
    }
}
