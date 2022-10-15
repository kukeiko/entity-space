import { EntitySchema, ExpansionValue } from "@entity-space/common";
import { Criterion, inRange, inSet, matches, or } from "@entity-space/criteria";
import { QueryPaging } from "../../lib/query/query-paging";
import { Query } from "../../lib/query/query";
import { reduceQuery } from "../../lib/query/reduce-query.fn";

describe("reduceQuery()", () => {
    function createQuery({
        criteria,
        expansion = {},
        paging,
        options,
    }: {
        criteria: Criterion;
        options?: Criterion;
        expansion?: ExpansionValue;
        paging?: QueryPaging;
    }): Query {
        const rootSchema = new EntitySchema("foo");
        const fooSchema = new EntitySchema("foo");
        const barSchema = new EntitySchema("bar");
        const bazSchema = new EntitySchema("baz");
        const moSchema = new EntitySchema("mo");
        const danSchema = new EntitySchema("dan");

        fooSchema.addRelationProperty("bar", barSchema, "barId", "id");
        barSchema
            .addRelationProperty("baz", bazSchema, "bazId", "id")
            .addRelationProperty("mo", moSchema, "moId", "id");

        moSchema.addRelationProperty("dan", danSchema, "danId", "id");

        rootSchema
            .addRelationProperty("foo", fooSchema, "fooId", "id")
            .addRelationProperty("bar", barSchema, "barId", "id");

        return new Query({ entitySchema: rootSchema, criteria, expansion, paging, options });
    }

    describe("full reduction", () => {
        it("{ id in [1, 2] / { foo } } should be completely reduced by { id in [1, 2, 3] / { foo } }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { foo: true } });
            const b = createQuery({ criteria: matches({ id: inSet([1, 2, 3]) }), expansion: { foo: true } });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{ id in [1, 2] / { foo: { bar: { baz, mo: { dan } } } } } should be completely reduced by { id in [1, 2, 3] / { foo: { bar: { baz, khaz, mo: { dan, zoo } } } } }", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ id: inSet([1, 2]) }),
                expansion: {
                    foo: { bar: { baz: true, mo: { dan: true } } },
                },
            });
            const b = createQuery({
                criteria: matches({ id: inSet([1, 2, 3]) }),
                expansion: {
                    foo: { bar: { baz: true, khaz: true, mo: { dan: true, zoo: true } } },
                },
            });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("song({ artistId: 7 })[0, 10] should be fully subtracted by song({ artistId: 7 })[0, 10]", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });
            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(subtracted).toEqual([]);
        });

        it("song<{ searchText: 'foo' }>({ artistId: 7 })[0, 10] should be fully subtracted by song<{ searchText: 'foo' }>({ artistId: 7 })[0, 10]", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: 7 }),
                options: matches({ searchText: "foo" }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                options: matches({ searchText: "foo" }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(subtracted).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        it("{ id in [1, 2] } reduced by { id in [1] } should be { id in [2] }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ id: inSet([1, 2]) }) });
            const b = createQuery({ criteria: matches({ id: inSet([1]) }) });
            const expected = [createQuery({ criteria: matches({ id: inSet([2]) }) })];
            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ id in [1, 2] / { foo } } reduced by { id in [1] / { foo } } should be { id in [2] / { foo } }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { foo: true } });
            const b = createQuery({ criteria: matches({ id: inSet([1]) }), expansion: { foo: true } });
            const expected = [createQuery({ criteria: matches({ id: inSet([2]) }), expansion: { foo: true } })];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ id in [1, 2] / { foo, bar } } reduced by { id in [1, 2] / { foo } } should be { id in [1, 2] / { bar } }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { foo: true, bar: true } });
            const b = createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { foo: true } });
            const expected = [createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { bar: true } })];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ id in [1, 2] / { foo, bar } } reduced by { id in [1] / { foo } } should be { id in [1] / { bar } }, { id in [2] / { foo, bar } }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { foo: true, bar: true } });
            const b = createQuery({ criteria: matches({ id: inSet([1]) }), expansion: { foo: true } });

            const expected = [
                createQuery({ criteria: matches({ id: inSet([2]) }), expansion: { foo: true, bar: true } }),
                createQuery({ criteria: matches({ id: inSet([1]) }), expansion: { bar: true } }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            // expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
            expect(reduced).toEqual(expected);
        });

        it("{ index:[1, 7] / { foo, bar } } reduced by { index:[3, 4] / { foo } } should be { index:([1, 3), (4, 7]) / { foo, bar } }, { index:[3, 4] / { bar } }", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ index: inRange(1, 7) }),
                expansion: {
                    foo: true,
                    bar: true,
                },
            });
            const b = createQuery({ criteria: matches({ index: inRange(3, 4) }), expansion: { foo: true } });

            const expected = [
                createQuery({
                    criteria: matches({
                        index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                    }),
                    expansion: {
                        foo: true,
                        bar: true,
                    },
                }),
                createQuery({ criteria: matches({ index: inRange(3, 4) }), expansion: { bar: true } }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            // expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
            expect(reduced).toEqual(expected);
        });

        it("{ index:[1, 7] } reduced by { index:[3, 4] } should be { index: ([1, 3), (4, 7]) }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ index: inRange(1, 7) }) });
            const b = createQuery({ criteria: matches({ index: inRange(3, 4) }) });
            const expected = [
                createQuery({
                    criteria: matches({
                        index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                    }),
                }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ index:[1, 7], price: [900, 1300] } reduced by { index:[3, 4], price: [1000, 1200] } should be { (index: ([1, 3), (4, 7]), price: [900, 1300]), (index:[3, 4], price: ([900, 1000), (1200, 1300])) }", () => {
            // arrange
            const a = createQuery({
                criteria: matches({
                    index: inRange(1, 7),
                    price: inRange(900, 1300),
                }),
            });
            const b = createQuery({
                criteria: matches({
                    index: inRange(3, 4),
                    price: inRange(1000, 1200),
                }),
            });

            const expected = [
                createQuery({
                    criteria: or([
                        matches({
                            index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                            price: inRange(900, 1300),
                        }),
                        matches({
                            index: inRange(3, 4),
                            price: or([inRange(900, 1000, [true, false]), inRange(1200, 1300, [false, true])]),
                        }),
                    ]),
                }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            // expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
            expect((reduced as []).length).toEqual(expected.length);
            expect(reduced).toEqual(expect.arrayContaining(expected));
        });

        it("{ index:[1, 7], price: [900, 1300] / { foo, bar } } reduced by { index:[3, 4], price: [1000, 1200] / { foo } } should be { ((index: ([1, 3), (4, 7]), price: [900, 1300]), (index:[3, 4], price: ([900, 1000), (1200, 1300]))) / { foo, bar } }, { index:[3, 4], price: [1000, 1200] / { bar } }", () => {
            // arrange
            const a = createQuery({
                criteria: matches({
                    index: inRange(1, 7),
                    price: inRange(900, 1300),
                }),
                expansion: { foo: true, bar: true },
            });
            const b = createQuery({
                criteria: matches({
                    index: inRange(3, 4),
                    price: inRange(1000, 1200),
                }),
                expansion: { foo: true },
            });

            const expected = [
                createQuery({
                    criteria: or([
                        matches({
                            index: or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]),
                            price: inRange(900, 1300),
                        }),
                        matches({
                            index: inRange(3, 4),
                            price: or([inRange(900, 1000, [true, false]), inRange(1200, 1300, [false, true])]),
                        }),
                    ]),
                    expansion: { foo: true, bar: true },
                }),
                createQuery({
                    criteria: matches({
                        index: inRange(3, 4),
                        price: inRange(1000, 1200),
                    }),
                    expansion: {
                        bar: true,
                    },
                }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            // expect(reduced).toEqual(jasmine.arrayWithExactContents(expected));
            expect((reduced as []).length).toEqual(expected.length);
            expect(reduced).toEqual(expect.arrayContaining(expected));
        });

        // reduce-query does not optimize during reduction
        it("{ price:[100,300], rating:[3,7] } reduced by ({ price:[100,200], rating:[3,5] } | { price:(200,300], rating:[3,5] }) should be ({ price: (200, 300], rating: (5, 7] } | { price: [100, 200], rating: (5, 7] })", () => {
            // arrange
            const a = createQuery({
                criteria: matches({
                    price: inRange(100, 300),
                    rating: inRange(3, 7),
                }),
            });

            const b = createQuery({
                criteria: or(
                    matches({
                        price: inRange(100, 200),
                        rating: inRange(3, 5),
                    }),
                    matches({
                        price: inRange(200, 300, [false, true]),
                        rating: inRange(3, 5),
                    })
                ),
            });

            const expected = [
                createQuery({
                    criteria: or(
                        matches({
                            price: inRange(200, 300, [false, true]),
                            rating: inRange(5, 7, [false, true]),
                        }),
                        matches({
                            price: inRange(100, 200),
                            rating: inRange(5, 7, [false, true]),
                        })
                    ),
                }),
            ];

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect((reduced as []).length).toEqual(expected.length);
            expect(reduced).toEqual(expect.arrayContaining(expected));
        });

        it("song({ artistId: 7 })[0, 10] subtracted by song({ artistId: 7 })[0, 5] should be song({ artistId: 7 })[6, 10]", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 5 }),
            });

            const expected = [
                createQuery({
                    criteria: matches({ artistId: 7 }),
                    paging: new QueryPaging({ sort: [], from: 6, to: 10 }),
                }),
            ];

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(typeof subtracted).not.toBe("boolean");
            expect((subtracted as []).length).toEqual(expected.length);
            expect(subtracted).toEqual(expected);
        });

        it("song({ artistId: 7 })[0, 10] subtracted by song({ artistId: 7 })[3, 5] should be song({ artistId: 7 })[0, 2] | song({ artistId: 7 })[6, 10]", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 3, to: 5 }),
            });

            const expected = [
                createQuery({
                    criteria: matches({ artistId: 7 }),
                    paging: new QueryPaging({ sort: [], from: 0, to: 2 }),
                }),
                createQuery({
                    criteria: matches({ artistId: 7 }),
                    paging: new QueryPaging({ sort: [], from: 6, to: 10 }),
                }),
            ];

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(typeof subtracted).not.toBe("boolean");
            expect((subtracted as []).length).toEqual(expected.length);
            expect(subtracted).toEqual(expected);
        });

        it("song({ artistId: 7 })[0, 10]/{ id, name } subtracted by song({ artistId: 7 })[0, 5]/{ id } should be song({ artistId: 7 })[6, 10]/{ id, name } | song({ artistId: 7 })[0, 5]/{ name }", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
                expansion: { id: true, name: true },
            });

            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 5 }),
                expansion: { id: true },
            });

            const expected = [
                createQuery({
                    criteria: matches({ artistId: 7 }),
                    paging: new QueryPaging({ sort: [], from: 6, to: 10 }),
                    expansion: { id: true, name: true },
                }),
                createQuery({
                    criteria: matches({ artistId: 7 }),
                    paging: new QueryPaging({ sort: [], from: 0, to: 5 }),
                    expansion: { name: true },
                }),
            ];

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(typeof subtracted).not.toBe("boolean");
            expect((subtracted as []).length).toEqual(expected.length);
            expect(subtracted).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("{ id in [1, 2] / { foo } } should not be reduced by { id in [1] }", () => {
            // arrange
            const a = createQuery({ criteria: matches({ id: inSet([1, 2]) }), expansion: { foo: true } });
            const b = createQuery({ criteria: matches({ id: inSet([1]) }) });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toEqual(false);
        });

        it("song({ artistId: { 7, 9 } })[0, 10] should not be subtracted by song({ artistId: 7 })[0, 10]", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: [7, 9] }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                paging: new QueryPaging({ sort: [], from: 0, to: 5 }),
            });

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(subtracted).toBe(false);
        });

        it("song<{ searchText: 'foo' }>({ artistId: 7 })[0, 10] should not be subtracted by song<{ searchText: 'bar' }>({ artistId: 7 })[0, 10]", () => {
            // arrange
            const a = createQuery({
                criteria: matches({ artistId: 7 }),
                options: matches({ searchText: "foo" }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            const b = createQuery({
                criteria: matches({ artistId: 7 }),
                options: matches({ searchText: "bar" }),
                paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            });

            // act
            const subtracted = reduceQuery(a, b);

            // assert
            expect(subtracted).toBe(false);
        });
    });
});
