import { parseCriteria } from "../../parser";
import { and, inRange, inSet, notInSet, or, ValueCriterion } from "../../value-criterion";

describe("parse-criteria", () => {
    function shouldParse(stringified: string, expected: ValueCriterion): void {
        it(`should parse ${stringified}`, () => {
            const parse = () => parseCriteria(stringified);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    shouldParse("[1, 7]", inRange(1, 7));
    shouldParse("[..., 7.8)", inRange(void 0, 7.8, false));
    shouldParse("[.9, 2]", inRange(0.9, 2));
    shouldParse("[.9, ...]", inRange(0.9));
    shouldParse("[-.9, +1.2]", inRange(-0.9, 1.2));
    shouldParse("[..., 3) | (4, 7]", or([inRange(void 0, 3, false), inRange(4, 7, [false, true])]));
    shouldParse("[1, 7] | [3, 4]", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("([1, 7] | [3, 4])", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("[1, 7] | [3, 4]", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("{1, 2}", inSet([1, 2]));
    shouldParse("!{1, 2}", notInSet([1, 2]));
    shouldParse("([1, 7] | [3, 4]) & ({123} | !{456})", and([or([inRange(1, 7), inRange(3, 4)]), or([inSet([123]), notInSet([456])])]));
});
