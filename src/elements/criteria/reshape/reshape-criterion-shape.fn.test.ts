import { describe, expect, it } from "vitest";
import { EntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array-criterion-shape";
import { InRangeCriterionShape } from "../in-range-criterion-shape";
import { NotEqualsCriterionShape } from "../not-equals-criterion-shape";
import { NotInArrayCriterionShape } from "../not-in-array-criterion-shape";
import { ReshapedCriterionShape } from "../reshaped-criterion-shape";
import { reshapeCriterionShape } from "./reshape-criterion-shape.fn";

describe(reshapeCriterionShape, () => {
    describe(EqualsCriterionShape, () => {
        it("Number", () => {
            // arrange
            const what = new EqualsCriterionShape([Number]);
            const by = [new EqualsCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(new EqualsCriterionShape([Number]));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ Number }", () => {
            // arrange
            const what = new InArrayCriterionShape([Number]);
            const by = [new EqualsCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(new EqualsCriterionShape([Number]));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ Number, String }", () => {
            // arrange
            const what = new InArrayCriterionShape([Number, String]);
            const by = [new EqualsCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(
                new EqualsCriterionShape([Number]),
                new InArrayCriterionShape([String]),
            );

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });
    });

    describe(InArrayCriterionShape, () => {
        it("Number", () => {
            // arrange
            const what = new EqualsCriterionShape([Number]);
            const by = [new InArrayCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(new InArrayCriterionShape([Number]));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("String", () => {
            // arrange
            const what = new EqualsCriterionShape([String]);
            const by = [new InArrayCriterionShape([Number])];

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).toBe(false);
        });

        it("{ Number, String }", () => {
            // arrange
            const what = new InArrayCriterionShape([Number, String]);
            const by = [new InArrayCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(
                new InArrayCriterionShape([Number]),
                new InArrayCriterionShape([String]),
            );

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });
    });

    describe(NotEqualsCriterionShape, () => {
        it("Number", () => {
            // arrange
            const what = new NotEqualsCriterionShape([Number]);
            const by = [new NotEqualsCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(new NotEqualsCriterionShape([Number]));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ Number }", () => {
            // arrange
            const what = new NotInArrayCriterionShape([Number]);
            const by = [new NotEqualsCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(new NotEqualsCriterionShape([Number]));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ Number, String }", () => {
            // arrange
            const what = new NotInArrayCriterionShape([Number, String]);
            const by = [new NotEqualsCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(
                new NotEqualsCriterionShape([Number]),
                new NotInArrayCriterionShape([String]),
            );

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });
    });

    describe(NotInArrayCriterionShape, () => {
        it("Number", () => {
            // arrange
            const what = new NotEqualsCriterionShape([Number]);
            const by = [new NotInArrayCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(new NotInArrayCriterionShape([Number]));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("String", () => {
            // arrange
            const what = new NotEqualsCriterionShape([String]);
            const by = [new NotInArrayCriterionShape([Number])];

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).toBe(false);
        });

        it("{ Number, String }", () => {
            // arrange
            const what = new NotInArrayCriterionShape([Number, String]);
            const by = [new NotInArrayCriterionShape([Number])];
            const expected = new ReshapedCriterionShape(
                new NotInArrayCriterionShape([Number]),
                new NotInArrayCriterionShape([String]),
            );

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });
    });

    describe(InRangeCriterionShape, () => {
        it("[Number, Number]", () => {
            // arrange
            const what = new InRangeCriterionShape(Number);
            const by = [new InRangeCriterionShape(Number)];
            const expected = new ReshapedCriterionShape(new InRangeCriterionShape(Number));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });
    });

    describe(EntityCriterionShape, () => {
        it("{ foo: { Number } } using { foo: Number }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: [[Number]] });
            const by = [new EntityCriterionShape({ foo: Number })];
            const expected = new ReshapedCriterionShape(new EntityCriterionShape({ foo: Number }));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ foo: { Number } } using { foo: String }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: [[Number]] });
            const by = [new EntityCriterionShape({ foo: String })];

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).toBe(false);
        });

        it("{ foo: Number } using { bar: Number }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: Number });
            const by = [new EntityCriterionShape({ bar: Number })];

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).toBe(false);
        });

        it("{ foo: Number } using { foo: Number, bar: Number }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: Number });
            const by = [new EntityCriterionShape({ foo: Number, bar: Number })];

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).toBe(false);
        });

        it("{ foo: Number, bar: Number } using { foo: Number }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: Number, bar: Number });
            const by = [new EntityCriterionShape({ foo: Number })];
            const expected = new ReshapedCriterionShape(new EntityCriterionShape({ foo: Number }));

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ foo: Number, String } using { foo: Number }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: [Number, String] });
            const by = [new EntityCriterionShape({ foo: Number })];
            const expected = new ReshapedCriterionShape(
                new EntityCriterionShape({ foo: Number }),
                new EntityCriterionShape({ foo: String }),
            );

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });

        it("{ foo: Number, String, bar: Number } using { foo: Number }", () => {
            // arrange
            const what = new EntityCriterionShape({ foo: [Number, String] });
            const by = [new EntityCriterionShape({ foo: Number })];
            const expected = new ReshapedCriterionShape(
                new EntityCriterionShape({ foo: Number }),
                new EntityCriterionShape({ foo: String, bar: Number }),
            );

            // act
            const reshaped = reshapeCriterionShape(what, by);

            // assert
            expect(reshaped).not.toBe(false);

            if (reshaped !== false) {
                expect(reshaped.getReshaped()).toStrictEqual(expected.getReshaped());
                expect(reshaped.getOpen()).toStrictEqual(expected.getOpen());
            }
        });
    });
});
