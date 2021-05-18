import { createFromToValueCriterion, createInValueCriterion, createNotInValueCriterion, reduceObjectCriteria, reduceObjectCriterion } from "src";

describe("reduce: object", () => {
    describe("full reduction", () => {
        // [todo] use all types of criteria for this test case - maybe even have two cases: 1 simple one, one with all types
        it("{ foo:{2} & bar:{3, 4, 7} } should be completely reduced by itself", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4, 7])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4, 7])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{ foo:{2} & bar:{3} } should be completely reduced by { foo:{2} }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{ foo:{2} & bar:{3} } should be completely reduced by { }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {};

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        /**
         * test names "x:y" means "a criterion A with x dimensions gets reduced by a criterion B with y dimensions".
         * we have this extra nested level of groups because it's already unwieldy to have them all flattened, and we'll even add more in the future.
         * grouping by amount of dimensions is the best i could come up with.
         */
        describe("1:1", () => {
            it("{ foo:{2, 3} } reduced by { foo:{3, 4} } should be { foo:{2} }", () => {
                // arrange
                const a = { foo: [createInValueCriterion([2, 3])] };
                const b = { foo: [createInValueCriterion([3, 4])] };
                const expected = [{ foo: [createInValueCriterion([2])] }];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("{ foo:{2} } reduced by { bar:{2} } should be { foo:{2} & bar:!{2} }", () => {
                // arrange
                const a = {
                    foo: [createInValueCriterion([2])],
                };

                const b = {
                    bar: [createInValueCriterion([2])],
                };

                const expected = [
                    {
                        foo: [createInValueCriterion([2])],
                        bar: [createNotInValueCriterion([2])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("1:2", () => {
            it("{ foo:{2} } reduced by { foo:{2} & bar:{3} } should be { foo:{2} & bar:!{3} }", () => {
                // arrange
                const a = {
                    foo: [createInValueCriterion([2])],
                };

                const b = {
                    foo: [createInValueCriterion([2])],
                    bar: [createInValueCriterion([3])],
                };

                const expected = [
                    {
                        foo: [createInValueCriterion([2])],
                        bar: [createNotInValueCriterion([3])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("2:1", () => {
            it("{ foo:{1, 2} & bar:{3} } reduced by { foo:{2} } should be { foo:{1} & bar:{3} }", () => {
                // arrange
                const a = {
                    foo: [createInValueCriterion([1, 2])],
                    bar: [createInValueCriterion([3])],
                };

                const b = {
                    foo: [createInValueCriterion([2])],
                };

                const expected = [
                    {
                        foo: [createInValueCriterion([1])],
                        bar: [createInValueCriterion([3])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("2:2", () => {
            it("{ foo:{1, 2} & bar:{3} } reduced by { foo:{2} & bar:{3, 4} } should be { foo:{1} & bar:{3} }", () => {
                // arrange
                const a = {
                    foo: [createInValueCriterion([1, 2])],
                    bar: [createInValueCriterion([3])],
                };

                const b = {
                    foo: [createInValueCriterion([2])],
                    bar: [createInValueCriterion([3, 4])],
                };

                const expected = [
                    {
                        foo: [createInValueCriterion([1])],
                        bar: [createInValueCriterion([3])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("{ foo:[1, 7] & bar:[100, 200] } reduced by { foo:[3, 4] & bar:[150, 175] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) })", () => {
                // arrange
                const a = {
                    foo: [createFromToValueCriterion([1, 7])],
                    bar: [createFromToValueCriterion([100, 200])],
                };

                const b = {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([150, 175])],
                };

                const expected = [
                    {
                        foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                        bar: [createFromToValueCriterion([100, 200])],
                    },
                    {
                        foo: [createFromToValueCriterion([3, 4])],
                        bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("changing order of criteria properties should still result in an equivalent outcome", () => {
                // arrange
                const a1 = {
                    bar: [createFromToValueCriterion([100, 200])],
                    foo: [createFromToValueCriterion([1, 7])],
                };

                const a2 = {
                    foo: [createFromToValueCriterion([1, 7])],
                    bar: [createFromToValueCriterion([100, 200])],
                };

                const b1 = {
                    bar: [createFromToValueCriterion([150, 175])],
                    foo: [createFromToValueCriterion([3, 4])],
                };

                const b2 = {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([150, 175])],
                };

                // act
                const reduced1 = reduceObjectCriterion(a1, b1);
                const reduced2 = reduceObjectCriterion(a2, b2);

                if (!reduced1 || reduced1.length == 0 || !reduced2 || reduced2.length == 0) {
                    return fail("expected both reductions to not be null");
                }

                const reduced_1_by_2 = reduceObjectCriteria(reduced1, reduced2);
                const reduced_2_by_1 = reduceObjectCriteria(reduced2, reduced1);

                // assert
                expect(reduced_1_by_2).toEqual([]);
                expect(reduced_2_by_1).toEqual([]);
            });
        });

        describe("3:2", () => {
            it("{ foo:[1, 7] & bar:[100, 200] & baz:[50, 70] } reduced by { foo:[3, 4] & bar:[150, 175] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] & baz:[50, 70] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) & baz:[50, 70] })", () => {
                // arrange
                const a = {
                    foo: [createFromToValueCriterion([1, 7])],
                    bar: [createFromToValueCriterion([100, 200])],
                    baz: [createFromToValueCriterion([50, 70])],
                };

                const b = {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([150, 175])],
                };

                const expected = [
                    {
                        foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                        bar: [createFromToValueCriterion([100, 200])],
                        baz: [createFromToValueCriterion([50, 70])],
                    },
                    {
                        foo: [createFromToValueCriterion([3, 4])],
                        bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                        baz: [createFromToValueCriterion([50, 70])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("3:3", () => {
            it("{ foo:[1, 7] & bar:[100, 200] & baz:[50, 70] } reduced by { foo:[3, 4] & bar:[150, 175] & baz:[55, 65] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] & baz:[50, 70] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) & baz:[50, 70] } | { foo:[3, 4] & bar:[150, 175] & baz:([50, 55) | (65, 70]) })", () => {
                // arrange
                const a = {
                    foo: [createFromToValueCriterion([1, 7])],
                    bar: [createFromToValueCriterion([100, 200])],
                    baz: [createFromToValueCriterion([50, 70])],
                };

                const b = {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([150, 175])],
                    baz: [createFromToValueCriterion([55, 65])],
                };

                const expected = [
                    {
                        foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                        bar: [createFromToValueCriterion([100, 200])],
                        baz: [createFromToValueCriterion([50, 70])],
                    },
                    {
                        foo: [createFromToValueCriterion([3, 4])],
                        bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                        baz: [createFromToValueCriterion([50, 70])],
                    },
                    {
                        foo: [createFromToValueCriterion([3, 4])],
                        bar: [createFromToValueCriterion([150, 175])],
                        baz: [createFromToValueCriterion([50, 55], [true, false]), createFromToValueCriterion([65, 70], [false, true])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("2:3", () => {
            it("{ foo:[1, 7] & bar:[100, 200] } reduced by { foo:[3, 4] & bar:[150, 175] & baz:[50, 70] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) } | { foo:[3, 4] & bar:[150, 175] & baz:([..., 50) | (70, ...]) })", () => {
                // arrange
                const a = {
                    foo: [createFromToValueCriterion([1, 7])],
                    bar: [createFromToValueCriterion([100, 200])],
                };

                const b = {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([150, 175])],
                    baz: [createFromToValueCriterion([50, 70])],
                };

                const expected = [
                    {
                        foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                        bar: [createFromToValueCriterion([100, 200])],
                    },
                    {
                        foo: [createFromToValueCriterion([3, 4])],
                        bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                    },
                    {
                        foo: [createFromToValueCriterion([3, 4])],
                        bar: [createFromToValueCriterion([150, 175])],
                        baz: [createFromToValueCriterion([void 0, 50], false), createFromToValueCriterion([70, void 0], false)],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("0:2", () => {
            it("{ } reduced by { foo:{2} & bar:{4} } should be ({ foo:!{2} } | { foo:{2} & bar:!{4} })", () => {
                // arrange
                const a = {};

                const b = {
                    foo: [createInValueCriterion([2])],
                    bar: [createInValueCriterion([4])],
                };

                const expected = [
                    {
                        foo: [createNotInValueCriterion([2])],
                    },
                    {
                        foo: [createInValueCriterion([2])],
                        bar: [createNotInValueCriterion([4])],
                    },
                ];

                // act
                const reduced = reduceObjectCriterion(a, b);

                // assert
                expect(reduced).toEqual(expected);
            });
        });
    });

    describe("no reduction", () => {
        it("{ foo:{3} } should not be reduced by { foo:{2} }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toBeFalse();
        });

        it("{ foo:{2} & bar:{3} } should not be reduced by { foo:{2} & bar:{4} }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([4])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
