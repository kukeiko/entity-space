import { Criterion, InNumberRangeCriterion, InNumberSetCriterion, inRange, InRangeCriterion, inSet, or, OrCriteriaTemplate } from "../../criterion";
import { parseCriteria } from "../../parser";

type RemapOneResult = ReturnType<Criterion["remapOne"]>;

describe("remapping", () => {
    it("in-number-range #1", () => {
        // arrange
        const criterion = inRange(1, 7);
        const template = new OrCriteriaTemplate([InNumberRangeCriterion]);
        const expected: RemapOneResult = [or(criterion)];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("in-number-range #2", () => {
        // arrange
        const criterion = inRange(1, 7);
        const template = new OrCriteriaTemplate([InNumberSetCriterion, InNumberRangeCriterion]);
        const expected: RemapOneResult = [or(criterion)];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("or-criteria #1", () => {
        // arrange
        const criterion = or(inRange(1, 7), inRange(10, 13));
        const template = InNumberRangeCriterion;
        const expected: RemapOneResult = [inRange(1, 7), or(inRange(10, 13))];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("or-criteria #2", () => {
        // arrange
        const criterion = or(inRange(1, 7), inRange(10, 13), inSet([1, 2, 3]));
        const template = new OrCriteriaTemplate([InNumberRangeCriterion]);
        const expected: RemapOneResult = [or(inRange(1, 7), inRange(10, 13)), or(inSet([1, 2, 3]))];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });
});
