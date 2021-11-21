import { Query, reduceQuery, inSet, inRange, Criterion, matches, or, Expansion } from "src";

describe("reduceQuery()", () => {
    function createQuery(criteria: Criterion, expansion: Expansion = {}): Query {
        return { criteria, expansion };
    }

    describe("full reduction", () => {
        it("{ id in [1, 2] / { foo } } should be completely reduced by { id in [1, 2, 3] / { foo } }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true });
            const b = createQuery(matches({ id: inSet([1, 2, 3]) }), { foo: true });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{ id in [1, 2] / { foo: { bar: { baz, mo: { dan } } } } } should be completely reduced by { id in [1, 2, 3] / { foo: { bar: { baz, khaz, mo: { dan, zoo } } } } }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), {
                foo: { bar: { baz: true, mo: { dan: true } } },
            });
            const b = createQuery(matches({ id: inSet([1, 2, 3]) }), {
                foo: { bar: { baz: true, khaz: true, mo: { dan: true, zoo: true } } },
            });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        it("{ id in [1, 2] } reduced by { id in [1] } should be { id in [2] }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }));
            const b = createQuery(matches({ id: inSet([1]) }));
            const expected = [createQuery(matches({ id: inSet([2]) }))];
            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ id in [1, 2] / { foo } } reduced by { id in [1] / { foo } } should be { id in [2] / { foo } }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true });
            const b = createQuery(matches({ id: inSet([1]) }), { foo: true });
            const expected = [createQuery(matches({ id: inSet([2]) }), { foo: true })];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ id in [1, 2] / { foo, bar } } reduced by { id in [1, 2] / { foo } } should be { id in [1, 2] / { bar } }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true, bar: true });
            const b = createQuery(matches({ id: inSet([1, 2]) }), { foo: true });
            const expected = [createQuery(matches({ id: inSet([1, 2]) }), { bar: true })];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ id in [1, 2] / { foo, bar } } reduced by { id in [1] / { foo } } should be { id in [1] / { bar } }, { id in [2] / { foo, bar } }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true, bar: true });
            const b = createQuery(matches({ id: inSet([1]) }), { foo: true });

            const expected = [createQuery(matches({ id: inSet([2]) }), { foo: true, bar: true }), createQuery(matches({ id: inSet([1]) }), { bar: true })];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            // expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
            expect(reduced).toEqual(expected);
        });

        it("{ index:[1, 7] / { foo, bar } } reduced by { index:[3, 4] / { foo } } should be { index:([1, 3), (4, 7]) / { foo, bar } }, { index:[3, 4] / { bar } }", () => {
            // arrange
            const a = createQuery(matches({ index: inRange(1, 7) }), {
                foo: true,
                bar: true,
            });
            const b = createQuery(matches({ index: inRange(3, 4) }), { foo: true });

            const expected = [
                createQuery(
                    matches({
                        index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                    }),
                    {
                        foo: true,
                        bar: true,
                    }
                ),
                createQuery(matches({ index: inRange(3, 4) }), { bar: true }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            // expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
            expect(reduced).toEqual(expected);
        });

        it("{ index:[1, 7] } reduced by { index:[3, 4] } should be { index: ([1, 3), (4, 7]) }", () => {
            // arrange
            const a = createQuery(matches({ index: inRange(1, 7) }));
            const b = createQuery(matches({ index: inRange(3, 4) }));
            const expected = [
                createQuery(
                    matches({
                        index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                    })
                ),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ index:[1, 7], price: [900, 1300] } reduced by { index:[3, 4], price: [1000, 1200] } should be { (index: ([1, 3), (4, 7]), price: [900, 1300]), (index:[3, 4], price: ([900, 1000), (1200, 1300])) }", () => {
            // arrange
            const a = createQuery(
                matches({
                    index: inRange(1, 7),
                    price: inRange(900, 1300),
                })
            );
            const b = createQuery(
                matches({
                    index: inRange(3, 4),
                    price: inRange(1000, 1200),
                })
            );

            const expected = [
                createQuery(
                    or([
                        matches({
                            index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                            price: inRange(900, 1300),
                        }),
                        matches({
                            index: inRange(3, 4),
                            price: or([inRange(900, 1000, [true, false]), inRange(1200, 1300, [false, true])]),
                        }),
                    ])
                ),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
        });

        it("{ index:[1, 7], price: [900, 1300] / { foo, bar } } reduced by { index:[3, 4], price: [1000, 1200] / { foo } } should be { ((index: ([1, 3), (4, 7]), price: [900, 1300]), (index:[3, 4], price: ([900, 1000), (1200, 1300]))) / { foo, bar } }, { index:[3, 4], price: [1000, 1200] / { bar } }", () => {
            // arrange
            const a = createQuery(
                matches({
                    index: inRange(1, 7),
                    price: inRange(900, 1300),
                }),
                { foo: true, bar: true }
            );
            const b = createQuery(
                matches({
                    index: inRange(3, 4),
                    price: inRange(1000, 1200),
                }),
                { foo: true }
            );

            const expected = [
                createQuery(
                    or([
                        matches({
                            index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                            price: inRange(900, 1300),
                        }),
                        matches({
                            index: inRange(3, 4),
                            price: or([inRange(900, 1000, [true, false]), inRange(1200, 1300, [false, true])]),
                        }),
                    ]),
                    { foo: true, bar: true }
                ),
                createQuery(
                    matches({
                        index: inRange(3, 4),
                        price: inRange(1000, 1200),
                    }),
                    {
                        bar: true,
                    }
                ),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
        });
    });

    describe("no reduction", () => {
        it("{ id in [1, 2] / { foo } } should not be reduced by { id in [1] }", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true });
            const b = createQuery(matches({ id: inSet([1]) }));

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
