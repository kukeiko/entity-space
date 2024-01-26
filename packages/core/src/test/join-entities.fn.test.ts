import { EntityMapper } from "../lib/entity/entity-mapper";

describe("joinEntities()", () => {
    let mapper: EntityMapper;

    beforeEach(() => {
        mapper = new EntityMapper();
    });

    it("primitive index: join", () => {
        interface Foo {
            id: number;
            joined?: Bar[];
        }

        interface Bar {
            id: number;
            fooId: number;
        }

        const fooEntities: Foo[] = [{ id: 1 }, { id: 2 }];

        const barEntities: Bar[] = [
            { id: 10, fooId: 2 },
            { id: 20, fooId: 1 },
            { id: 30, fooId: 3 },
            { id: 40, fooId: 1 },
            { id: 50, fooId: 2 },
        ];

        mapper.joinEntities(fooEntities, barEntities, "joined", ["id"], ["fooId"], true);

        expect(fooEntities).toEqual<Required<Foo>[]>([
            {
                id: 1,
                joined: [
                    { id: 20, fooId: 1 },
                    { id: 40, fooId: 1 },
                ],
            },
            {
                id: 2,
                joined: [
                    { id: 10, fooId: 2 },
                    { id: 50, fooId: 2 },
                ],
            },
        ]);
    });

    it("composite index: join", () => {
        interface Foo {
            id: number;
            namespace: string;
            joined?: Bar[];
        }

        interface Bar {
            id: number;
            namespace: string;
            fooId: number;
        }

        const fooEntities: Foo[] = [
            { id: 1, namespace: "chicken" },
            { id: 1, namespace: "cheese" },
            { id: 2, namespace: "chicken" },
        ];

        const barEntities: Bar[] = [
            { id: 10, fooId: 2, namespace: "chicken" },
            { id: 20, fooId: 1, namespace: "chicken" },
            { id: 30, fooId: 3, namespace: "chicken" },
            { id: 40, fooId: 1, namespace: "cheese" },
            { id: 50, fooId: 2, namespace: "cheese" },
        ];

        mapper.joinEntities(fooEntities, barEntities, "joined", ["id", "namespace"], ["fooId", "namespace"], true);

        expect(fooEntities).toEqual<Required<Foo>[]>([
            {
                id: 1,
                namespace: "chicken",
                joined: [{ id: 20, fooId: 1, namespace: "chicken" }],
            },
            {
                id: 1,
                namespace: "cheese",
                joined: [{ id: 40, fooId: 1, namespace: "cheese" }],
            },
            {
                id: 2,
                namespace: "chicken",
                joined: [{ id: 10, fooId: 2, namespace: "chicken" }],
            },
        ]);
    });

    describe("empty join", () => {
        it("single path", () => {
            // arrange
            interface Foo {
                id: number;
                barId: number;
                bar?: Bar;
            }

            interface Bar {
                id: number;
            }

            const fooEntities: Foo[] = [
                { id: 1, barId: 10 },
                { id: 2, barId: 20 },
            ];
            const barEntities: Bar[] = [{ id: 20 }];

            // act
            mapper.joinEntities(fooEntities, barEntities, "bar", ["barId"], ["id"]);

            // assert
            expect(fooEntities).toEqual<Foo[]>([
                {
                    id: 1,
                    barId: 10,
                },
                {
                    id: 2,
                    barId: 20,
                    bar: { id: 20 },
                },
            ]);
        });

        it("single path: nullable", () => {
            // arrange
            interface Foo {
                id: number;
                barId: number;
                bar?: Bar | null;
            }

            interface Bar {
                id: number;
            }

            const fooEntities: Foo[] = [
                { id: 1, barId: 10 },
                { id: 2, barId: 20 },
            ];
            const barEntities: Bar[] = [{ id: 20 }];

            // act
            mapper.joinEntities(fooEntities, barEntities, "bar", ["barId"], ["id"], false, true);

            // assert
            expect(fooEntities).toEqual<Required<Foo>[]>([
                {
                    id: 1,
                    barId: 10,
                    bar: null,
                },
                {
                    id: 2,
                    barId: 20,
                    bar: { id: 20 },
                },
            ]);
        });

        it("single path: array", () => {
            // arrange
            interface Foo {
                id: number;
                joined?: Bar[];
            }

            interface Bar {
                id: number;
                fooId: number;
            }

            const fooEntities: Foo[] = [{ id: 1 }, { id: 2 }];
            const barEntities: Bar[] = [];

            // act
            mapper.joinEntities(fooEntities, barEntities, "joined", ["id"], ["fooId"], true);

            // assert
            expect(fooEntities).toEqual<Required<Foo>[]>([
                {
                    id: 1,
                    joined: [],
                },
                {
                    id: 2,
                    joined: [],
                },
            ]);
        });

        it("multi path", () => {
            // arrange
            interface Foo {
                id: number;
                barId: number;
                namespaceId: number;
                bar?: Bar;
            }

            interface Bar {
                id: number;
                namespaceId: number;
            }

            const fooEntities: Foo[] = [
                { id: 1, barId: 10, namespaceId: 100 },
                { id: 2, barId: 20, namespaceId: 200 },
            ];
            const barEntities: Bar[] = [{ id: 20, namespaceId: 200 }];

            // act
            mapper.joinEntities(fooEntities, barEntities, "bar", ["namespaceId", "barId"], ["namespaceId", "id"]);

            // assert
            expect(fooEntities).toEqual<Foo[]>([
                { id: 1, barId: 10, namespaceId: 100 },
                { id: 2, barId: 20, namespaceId: 200, bar: { id: 20, namespaceId: 200 } },
            ]);
        });

        it("multi path: nullable", () => {
            // arrange
            interface Foo {
                id: number;
                barId: number;
                namespaceId: number;
                bar?: Bar | null;
            }

            interface Bar {
                id: number;
                namespaceId: number;
            }

            const fooEntities: Foo[] = [
                { id: 1, barId: 10, namespaceId: 100 },
                { id: 2, barId: 20, namespaceId: 200 },
            ];
            const barEntities: Bar[] = [{ id: 20, namespaceId: 200 }];

            // act
            mapper.joinEntities(
                fooEntities,
                barEntities,
                "bar",
                ["namespaceId", "barId"],
                ["namespaceId", "id"],
                false,
                true
            );

            // assert
            expect(fooEntities).toEqual<Foo[]>([
                { id: 1, barId: 10, namespaceId: 100, bar: null },
                { id: 2, barId: 20, namespaceId: 200, bar: { id: 20, namespaceId: 200 } },
            ]);
        });

        it("multi path: array", () => {
            // arrange
            interface Foo {
                id: number;
                namespaceId: number;
                joined?: Bar[];
            }

            interface Bar {
                id: number;
                namespaceId: number;
                fooId: number;
            }

            const fooEntities: Foo[] = [
                { id: 1, namespaceId: 100 },
                { id: 2, namespaceId: 200 },
            ];
            const barEntities: Bar[] = [{ id: 20, namespaceId: 200, fooId: 2 }];

            // act
            mapper.joinEntities(
                fooEntities,
                barEntities,
                "joined",
                ["namespaceId", "id"],
                ["namespaceId", "fooId"],
                true
            );

            // assert
            expect(fooEntities).toEqual<Required<Foo>[]>([
                {
                    id: 1,
                    namespaceId: 100,
                    joined: [],
                },
                {
                    id: 2,
                    namespaceId: 200,
                    joined: [{ id: 20, namespaceId: 200, fooId: 2 }],
                },
            ]);
        });
    });
});
