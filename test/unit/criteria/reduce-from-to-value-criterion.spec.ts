import { InRangeCriterion } from "../../../src/criteria/value-criterion/_new-stuff/in-range-criterion";
import { InSetCriterion } from "../../../src/criteria/value-criterion/_new-stuff/in-set-criterion";

describe("reduce: from-to", () => {
    describe("full reduction", () => {
        it("[1, 7] should be completely reduced by itself", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [1, 7]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("[1, 7] should be completely reduced by [0, 8]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [0, 8]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("[1, 7] should be completely reduced by (0, 8)", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [0, 8], false);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("[1, 7] should be completely reduced by [0, ...]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [0, void 0]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("[4, ...] should be completely reduced by [3, ...]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [4, void 0]);
            const b = new InRangeCriterion(Number, [3, void 0]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("[..., 4] should be completely reduced by [..., 5]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [void 0, 4]);
            const b = new InRangeCriterion(Number, [void 0, 5]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("[1, 7] should be completely reduced by [..., 9]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [void 0, 9]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        describe("head reduction", () => {
            it("[1, 7] reduced by [-3, 5] should be (5, 7]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [-3, 5]);
                const expected = [new InRangeCriterion(Number, [5, 7], [false, true])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[3, ...] reduced by [1, 8] should be (8, ...]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [3, void 0]);
                const b = new InRangeCriterion(Number, [1, 8]);
                const expected = [new InRangeCriterion(Number, [8, void 0], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[3, ...] reduced by [1, 8) should be [8, ...]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [3, void 0]);
                const b = new InRangeCriterion(Number, [1, 8], [true, false]);
                const expected = [new InRangeCriterion(Number, [8, void 0])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, 7] reduced by [..., 3) should be [3, 7]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [void 0, 3], false);
                const expected = [new InRangeCriterion(Number, [3, 7])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("tail reduction", () => {
            it("[1, 7] reduced by [3, 10] should be [1, 3)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [3, 10]);
                const expected = [new InRangeCriterion(Number, [1, 3], [true, false])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, 7] reduced by (3, 8] should be [1, 3]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [3, 8], [false, true]);
                const expected = [new InRangeCriterion(Number, [1, 3])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[..., 3] reduced by [1, 8] should be [..., 1)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [void 0, 3]);
                const b = new InRangeCriterion(Number, [1, 8]);
                const expected = [new InRangeCriterion(Number, [void 0, 1], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[..., 3] reduced by (1, 8] should be [..., 1)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [void 0, 3]);
                const b = new InRangeCriterion(Number, [1, 8], [false, true]);
                const expected = [new InRangeCriterion(Number, [void 0, 1])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, 7] reduced by [3, ...] should be [1, 3)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [3, void 0]);
                const expected = [new InRangeCriterion(Number, [1, 3], [true, false])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("body reduction", () => {
            it("[1, 7] reduced by [3, 4] should be [1, 3) | (4, 7]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [3, 4]);
                const expected = [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("(1, 7) reduced by [3, 4] should be (1, 3) | (4, 7)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7], false);
                const b = new InRangeCriterion(Number, [3, 4]);
                const expected = [new InRangeCriterion(Number, [1, 3], false), new InRangeCriterion(Number, [4, 7], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("(1, 7) reduced by (3, 4) should be (1, 3] | [4, 7)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7], false);
                const b = new InRangeCriterion(Number, [3, 4], false);
                const expected = [new InRangeCriterion(Number, [1, 3], [false, true]), new InRangeCriterion(Number, [4, 7], [true, false])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[..., 7] reduced by [3, 4] should be [..., 3) | (4, 7]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [void 0, 7]);
                const b = new InRangeCriterion(Number, [3, 4]);
                const expected = [new InRangeCriterion(Number, [void 0, 3], false), new InRangeCriterion(Number, [4, 7], [false, true])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[..., 7] reduced by (3, 4) should be [..., 3] | [4, 7]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [void 0, 7]);
                const b = new InRangeCriterion(Number, [3, 4], false);
                const expected = [new InRangeCriterion(Number, [void 0, 3]), new InRangeCriterion(Number, [4, 7])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, ...] reduced by [3, 4] should be [1, 3) | (4, ...]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, void 0]);
                const b = new InRangeCriterion(Number, [3, 4]);
                const expected = [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, void 0], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, ...] reduced by (3, 4) should be [1, 3] | [4, ...]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, void 0]);
                const b = new InRangeCriterion(Number, [3, 4], false);
                const expected = [new InRangeCriterion(Number, [1, 3]), new InRangeCriterion(Number, [4, void 0])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            // [todo] [1, 1] | [7, 7] could also be repesented as {1, 7}
            // something to think about :)
            it("[1, 7] reduced by (1, 7) should be [1, 1] | [7, 7]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 7]);
                const b = new InRangeCriterion(Number, [1, 7], false);
                const expected = [new InRangeCriterion(Number, [1, 1]), new InRangeCriterion(Number, [7, 7])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("reduction by: in", () => {
            it("[1, 2] reduced by {2} should be [1, 2)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 2]);
                const b = new InSetCriterion(Number, [2]);
                const expected = [new InRangeCriterion(Number, [1, 2], [true, false])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, 2] reduced by {1} should be (1, 2]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 2]);
                const b = new InSetCriterion(Number, [1]);
                const expected = [new InRangeCriterion(Number, [1, 2], [false, true])];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, 2] reduced by {1, 2} should be (1, 2)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, 2]);
                const b = new InSetCriterion(Number, [1, 2]);
                const expected = [new InRangeCriterion(Number, [1, 2], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[..., 2] reduced by {1, 2} should be [..., 2)", () => {
                // arrange
                const a = new InRangeCriterion(Number, [void 0, 2]);
                const b = new InSetCriterion(Number, [1, 2]);
                const expected = [new InRangeCriterion(Number, [void 0, 2], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("[1, ...] reduced by {1, 2} should be (1, ...]", () => {
                // arrange
                const a = new InRangeCriterion(Number, [1, void 0]);
                const b = new InSetCriterion(Number, [1, 2]);
                const expected = [new InRangeCriterion(Number, [1, void 0], false)];

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });
    });

    describe("no reduction", () => {
        // [todo] now that we allow for splitting a range into smaller parts we might want this reduction to actually do something
        // (instead of doing nothing). the problem is though that a "from-to" reduced by an "in" with lots of values will create
        // lots of queries and hinder performance. also, it would only work with from-to of type integer (which we don't distinguish yet)
        it("[1, 3] should not be reduced by {2}", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 3]);
            const b = new InSetCriterion(Number, [2]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("[1, 7] should not be reduced by (7, 13]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [7, 13], [false, true]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("[1, 7] should not be reduced by [8, 13]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [8, 13]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("[1, 7] should not be reduced by [..., 1)", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [void 0, 1], false);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("[1, 7] should not be reduced by [..., 0]", () => {
            // arrange
            const a = new InRangeCriterion(Number, [1, 7]);
            const b = new InRangeCriterion(Number, [void 0, 0]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
