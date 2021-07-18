import { and, or, ValueCriteria, ValueCriterion } from "../../value-criterion";
import { Token } from "../token";
import { TokenType } from "../token-type.enum";
import { InRangeTokenParser } from "./in-range-token-parser";
import { SetTokenParser } from "./set-token-parser";
import { TokenParser } from "./token-parser";

export class ValueCriteriaTokenParser implements TokenParser<ValueCriteria> {
    private isOpen = false;
    private items: ValueCriterion[] = [];
    private combinator?: "&" | "|";
    private isClosed = false;
    private openParsers: TokenParser<ValueCriterion>[] = [];
    private expectingCombinator = false;

    accept(token: Token): boolean {
        if (!this.isOpen) {
            if (token.type === TokenType.Special && token.value === "(") {
                this.isOpen = true;
                this.openParsers = [new InRangeTokenParser(), new SetTokenParser(), new ValueCriteriaTokenParser()];
                return true;
            } else {
                return false;
            }
        }

        if (!this.expectingCombinator) {
            const nextParsers: TokenParser<ValueCriterion>[] = [];

            for (const parser of this.openParsers) {
                if (parser.accept(token)) {
                    if (parser.isComplete()) {
                        this.items.push(parser.getResult());
                        this.openParsers = [new InRangeTokenParser(), new SetTokenParser(), new ValueCriteriaTokenParser()];
                        this.expectingCombinator = true;
                        return true;
                    }

                    nextParsers.push(parser);
                }
            }

            this.openParsers = nextParsers;
            return nextParsers.length > 0;
        } else if (token.type === TokenType.Combinator) {
            if (this.combinator !== void 0 && token.value !== this.combinator) {
                throw new Error("value criteria with both '&' or '|' need to be explicitly nested, e.g. (a | (b & c)) instead of (a | b & c)");
            }

            this.combinator = token.value === "&" ? "&" : "|";
            this.expectingCombinator = false;
            return true;
        } else if (token.type === TokenType.Special && token.value === ")") {
            this.isClosed = true;

            if (this.combinator === void 0) {
                this.combinator = "|";
            }

            return true;
        }

        return false;
    }

    isComplete(): boolean {
        return this.isOpen && this.isClosed && this.combinator !== void 0;
    }

    getResult(): ValueCriteria<unknown> {
        if (!this.isOpen || !this.isClosed || this.combinator === void 0) {
            throw new Error("calling getResult() on incomplete value-criteria-token-parser");
        }

        if (this.combinator === "&") {
            return and(this.items);
        } else {
            return or(this.items);
        }
    }
}
