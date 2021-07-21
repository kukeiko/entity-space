import { inRange, inSet, notInSet, entityCriteria } from "../../value-criterion";

describe("reducing: entity-criteria", () => {
    interface FooBarBaz {
        foo: number;
        bar: number;
        baz: number;
    }

    describe("full reduction", () => {
        // [todo] use all types of criteria for this test case - maybe even have two cases: 1 simple one, one with all types
        it("{ foo:{2} & bar:{3, 4, 7} } should be completely reduced by itself", () => {
            // arrange
            const a = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([3, 4, 7]),
            });

            const b = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([3, 4, 7]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(true);
        });

        it("{ foo:{2} & bar:{3} } should be completely reduced by { foo:{2} }", () => {
            // arrange
            const a = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([3]),
            });

            const b = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(true);
        });

        it("{ foo:{2} & bar:{3} } should be completely reduced by { }", () => {
            // arrange
            const a = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([3]),
            });

            const b = entityCriteria<FooBarBaz>({});

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(true);
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
                const a = entityCriteria<FooBarBaz>({ foo: inSet([2, 3]) });
                const b = entityCriteria<FooBarBaz>({ foo: inSet([3, 4]) });
                const expected = entityCriteria<FooBarBaz>([{ foo: inSet([2]) }]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("{ foo:{2} } reduced by { bar:{2} } should be { foo:{2} & bar:!{2} }", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inSet([2]),
                });

                const b = entityCriteria<FooBarBaz>({
                    bar: inSet([2]),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: inSet([2]),
                        bar: notInSet([2]),
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("1:2", () => {
            it("{ foo:{2} } reduced by { foo:{2} & bar:{3} } should be { foo:{2} & bar:!{3} }", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inSet([2]),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inSet([2]),
                    bar: inSet([3]),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: inSet([2]),
                        bar: notInSet([3]),
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("2:1", () => {
            it("{ foo:{1, 2} & bar:{3} } reduced by { foo:{2} } should be { foo:{1} & bar:{3} }", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inSet([1, 2]),
                    bar: inSet([3]),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inSet([2]),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: inSet([1]),
                        bar: inSet([3]),
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("2:2", () => {
            it("{ foo:{1, 2} & bar:{3} } reduced by { foo:{2} & bar:{3, 4} } should be { foo:{1} & bar:{3} }", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inSet([1, 2]),
                    bar: inSet([3]),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inSet([2]),
                    bar: inSet([3, 4]),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: inSet([1]),
                        bar: inSet([3]),
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("{ foo:[1, 7] & bar:[100, 200] } reduced by { foo:[3, 4] & bar:[150, 175] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) })", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inRange(1, 7),
                    bar: inRange(100, 200),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inRange(3, 4),
                    bar: inRange(150, 175),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        // foo: ([new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])]),
                        foo: [inRange(1, 3, [true, false]), inRange(4, 7, [false, true])],
                        bar: inRange(100, 200),
                    },
                    {
                        foo: inRange(3, 4),
                        bar: [inRange(100, 150, [true, false]), inRange(175, 200, [false, true])],
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("changing order of criteria properties should still result in an equivalent outcome", () => {
                // arrange
                const a1 = entityCriteria<FooBarBaz>({
                    bar: inRange(100, 200),
                    foo: inRange(1, 7),
                });

                const a2 = entityCriteria<FooBarBaz>({
                    foo: inRange(1, 7),
                    bar: inRange(100, 200),
                });

                const b1 = entityCriteria<FooBarBaz>({
                    bar: inRange(150, 175),
                    foo: inRange(3, 4),
                });

                const b2 = entityCriteria<FooBarBaz>({
                    foo: inRange(3, 4),
                    bar: inRange(150, 175),
                });

                // act
                const reduced1 = b1.reduce(a1);
                const reduced2 = b2.reduce(a2);

                if (reduced1 === true || !reduced1 || reduced1.items.length == 0 || reduced2 === true || !reduced2 || reduced2.items.length == 0) {
                    return fail("expected both reductions to not be false/true");
                }

                const reduced_1_by_2 = reduced2.reduce(reduced1);
                const reduced_2_by_1 = reduced1.reduce(reduced2);

                // assert
                expect(reduced_1_by_2).toEqual(true);
                expect(reduced_2_by_1).toEqual(true);
            });
        });

        describe("3:2", () => {
            it("{ foo:[1, 7] & bar:[100, 200] & baz:[50, 70] } reduced by { foo:[3, 4] & bar:[150, 175] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] & baz:[50, 70] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) & baz:[50, 70] })", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inRange(1, 7),
                    bar: inRange(100, 200),
                    baz: inRange(50, 70),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inRange(3, 4),
                    bar: inRange(150, 175),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: [inRange(1, 3, [true, false]), inRange(4, 7, [false, true])],
                        bar: inRange(100, 200),
                        baz: inRange(50, 70),
                    },
                    {
                        foo: inRange(3, 4),
                        bar: [inRange(100, 150, [true, false]), inRange(175, 200, [false, true])],
                        baz: inRange(50, 70),
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("3:3", () => {
            it("{ foo:[1, 7] & bar:[100, 200] & baz:[50, 70] } reduced by { foo:[3, 4] & bar:[150, 175] & baz:[55, 65] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] & baz:[50, 70] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) & baz:[50, 70] } | { foo:[3, 4] & bar:[150, 175] & baz:([50, 55) | (65, 70]) })", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inRange(1, 7),
                    bar: inRange(100, 200),
                    baz: inRange(50, 70),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inRange(3, 4),
                    bar: inRange(150, 175),
                    baz: inRange(55, 65),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: [inRange(1, 3, [true, false]), inRange(4, 7, [false, true])],
                        bar: inRange(100, 200),
                        baz: inRange(50, 70),
                    },
                    {
                        foo: inRange(3, 4),
                        bar: [inRange(100, 150, [true, false]), inRange(175, 200, [false, true])],
                        baz: inRange(50, 70),
                    },
                    {
                        foo: inRange(3, 4),
                        bar: inRange(150, 175),
                        baz: [inRange(50, 55, [true, false]), inRange(65, 70, [false, true])],
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("2:3", () => {
            it("{ foo:[1, 7] & bar:[100, 200] } reduced by { foo:[3, 4] & bar:[150, 175] & baz:[50, 70] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) } | { foo:[3, 4] & bar:[150, 175] & baz:([..., 50) | (70, ...]) })", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({
                    foo: inRange(1, 7),
                    bar: inRange(100, 200),
                });

                const b = entityCriteria<FooBarBaz>({
                    foo: inRange(3, 4),
                    bar: inRange(150, 175),
                    baz: inRange(50, 70),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: [inRange(1, 3, [true, false]), inRange(4, 7, [false, true])],
                        bar: inRange(100, 200),
                    },
                    {
                        foo: inRange(3, 4),
                        bar: [inRange(100, 150, [true, false]), inRange(175, 200, [false, true])],
                    },
                    {
                        foo: inRange(3, 4),
                        bar: inRange(150, 175),
                        baz: [inRange(void 0, 50, false), inRange(70, void 0, false)],
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        describe("0:2", () => {
            it("{ } reduced by { foo:{2} & bar:{4} } should be ({ foo:!{2} } | { foo:{2} & bar:!{4} })", () => {
                // arrange
                const a = entityCriteria<FooBarBaz>({});

                const b = entityCriteria<FooBarBaz>({
                    foo: inSet([2]),
                    bar: inSet([4]),
                });

                const expected = entityCriteria<FooBarBaz>([
                    {
                        foo: notInSet([2]),
                    },
                    {
                        foo: inSet([2]),
                        bar: notInSet([4]),
                    },
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });
        });

        it("{ foo:{ bar:[1, 7] } } reduced by { foo: { bar:[3, 4] } } should be { foo:{ bar:([1, 3) | (4, 7]) } }", () => {
            interface NestedFooBar {
                foo: {
                    bar: number;
                };
            }

            // arrange
            entityCriteria<NestedFooBar>({
                foo: [
                    {
                        bar: inRange(1, 7),
                    },
                ],
            });
            const a = entityCriteria<NestedFooBar>({
                foo: [{ bar: inRange(1, 7) }],
            });

            const b = entityCriteria<NestedFooBar>({
                foo: [{ bar: inRange(3, 4) }],
            });

            const expected = entityCriteria<NestedFooBar>([
                {
                    foo: [
                        {
                            bar: [inRange(1, 3, [true, false]), inRange(4, 7, [false, true])],
                        },
                    ],
                },
            ]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("{ foo:{3} } should not be reduced by { foo:{2} }", () => {
            // arrange
            const a = entityCriteria<FooBarBaz>({
                foo: inSet([3]),
            });

            const b = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("{ foo:{2} & bar:{3} } should not be reduced by { foo:{2} & bar:{4} }", () => {
            // arrange
            const a = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([3]),
            });

            const b = entityCriteria<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([4]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
