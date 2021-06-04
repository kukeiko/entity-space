import { InRangeCriterion, InSetCriterion, NotInSetCriterion, ObjectCriteria, ObjectCriterion, ValueCriteria } from "../../../src";

describe("reduce: object", () => {
    interface FooBarBaz {
        foo: number;
        bar: number;
        baz: number;
    }

    describe("full reduction", () => {
        // [todo] use all types of criteria for this test case - maybe even have two cases: 1 simple one, one with all types
        it("{ foo:{2} & bar:{3, 4, 7} } should be completely reduced by itself", () => {
            // arrange
            const a = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3, 4, 7])]),
            });

            const b = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3, 4, 7])]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(new ObjectCriteria([]));
        });

        it("{ foo:{2} & bar:{3} } should be completely reduced by { foo:{2} }", () => {
            // arrange
            const a = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
            });

            const b = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(new ObjectCriteria([]));
        });

        it("{ foo:{2} & bar:{3} } should be completely reduced by { }", () => {
            // arrange
            const a = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
            });

            const b = new ObjectCriterion<FooBarBaz>({});

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(new ObjectCriteria([]));
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
                const a = new ObjectCriterion<FooBarBaz>({ foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2, 3])]) });
                const b = new ObjectCriterion<FooBarBaz>({ foo: new ValueCriteria(Number, [new InSetCriterion(Number, [3, 4])]) });
                const expected = new ObjectCriteria([new ObjectCriterion<FooBarBaz>({ foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]) })]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("{ foo:{2} } reduced by { bar:{2} } should be { foo:{2} & bar:!{2} }", () => {
                // arrange
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    bar: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                        bar: new ValueCriteria(Number, [new NotInSetCriterion(Number, [2])]),
                    }),
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
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                    bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                        bar: new ValueCriteria(Number, [new NotInSetCriterion(Number, [3])]),
                    }),
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
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [1, 2])]),
                    bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InSetCriterion(Number, [1])]),
                        bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
                    }),
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
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [1, 2])]),
                    bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                    bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3, 4])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InSetCriterion(Number, [1])]),
                        bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
                    }),
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("{ foo:[1, 7] & bar:[100, 200] } reduced by { foo:[3, 4] & bar:[150, 175] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) })", () => {
                // arrange
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 150], [true, false]), new InRangeCriterion(Number, [175, 200], [false, true])]),
                    }),
                ]);

                // act
                const reduced = b.reduce(a);

                // assert
                expect(reduced).toEqual(expected);
            });

            it("changing order of criteria properties should still result in an equivalent outcome", () => {
                // arrange
                const a1 = new ObjectCriterion<FooBarBaz>({
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]),
                });

                const a2 = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                });

                const b1 = new ObjectCriterion<FooBarBaz>({
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                });

                const b2 = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                });

                // act
                const reduced1 = b1.reduce(a1);
                const reduced2 = b2.reduce(a2);

                if (!reduced1 || reduced1.items.length == 0 || !reduced2 || reduced2.items.length == 0) {
                    return fail("expected both reductions to not be null");
                }

                const reduced_1_by_2 = reduced2.reduce(reduced1);
                const reduced_2_by_1 = reduced1.reduce(reduced2);

                // assert
                expect(reduced_1_by_2).toEqual(new ObjectCriteria([]));
                expect(reduced_2_by_1).toEqual(new ObjectCriteria([]));
            });
        });

        describe("3:2", () => {
            it("{ foo:[1, 7] & bar:[100, 200] & baz:[50, 70] } reduced by { foo:[3, 4] & bar:[150, 175] } should be ({ foo:([1, 3) | (4, 7]) & bar:[100, 200] & baz:[50, 70] } | { foo:[3, 4] & bar:([100, 150) | (175, 200]) & baz:[50, 70] })", () => {
                // arrange
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                    baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                        baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 150], [true, false]), new InRangeCriterion(Number, [175, 200], [false, true])]),
                        baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                    }),
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
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                    baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                    baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [55, 65])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                        baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 150], [true, false]), new InRangeCriterion(Number, [175, 200], [false, true])]),
                        baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                        baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 55], [true, false]), new InRangeCriterion(Number, [65, 70], [false, true])]),
                    }),
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
                const a = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                });

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                    bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                    baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [50, 70])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 200])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [100, 150], [true, false]), new InRangeCriterion(Number, [175, 200], [false, true])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]),
                        bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [150, 175])]),
                        baz: new ValueCriteria(Number, [new InRangeCriterion(Number, [void 0, 50], false), new InRangeCriterion(Number, [70, void 0], false)]),
                    }),
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
                const a = new ObjectCriterion<FooBarBaz>({});

                const b = new ObjectCriterion<FooBarBaz>({
                    foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                    bar: new ValueCriteria(Number, [new InSetCriterion(Number, [4])]),
                });

                const expected = new ObjectCriteria([
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new NotInSetCriterion(Number, [2])]),
                    }),
                    new ObjectCriterion<FooBarBaz>({
                        foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                        bar: new ValueCriteria(Number, [new NotInSetCriterion(Number, [4])]),
                    }),
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
            const a = new ObjectCriterion<NestedFooBar>({
                foo: new ObjectCriteria([new ObjectCriterion<FooBarBaz>({ bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 7])]) })]),
            });

            const b = new ObjectCriterion<NestedFooBar>({
                foo: new ObjectCriteria([new ObjectCriterion<FooBarBaz>({ bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [3, 4])]) })]),
            });

            const expected = new ObjectCriteria([
                new ObjectCriterion<NestedFooBar>({
                    foo: new ObjectCriteria([
                        new ObjectCriterion<NestedFooBar["foo"]>({
                            bar: new ValueCriteria(Number, [new InRangeCriterion(Number, [1, 3], [true, false]), new InRangeCriterion(Number, [4, 7], [false, true])]),
                        }),
                    ]),
                }),
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
            const a = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
            });

            const b = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("{ foo:{2} & bar:{3} } should not be reduced by { foo:{2} & bar:{4} }", () => {
            // arrange
            const a = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                bar: new ValueCriteria(Number, [new InSetCriterion(Number, [3])]),
            });

            const b = new ObjectCriterion<FooBarBaz>({
                foo: new ValueCriteria(Number, [new InSetCriterion(Number, [2])]),
                bar: new ValueCriteria(Number, [new InSetCriterion(Number, [4])]),
            });

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
