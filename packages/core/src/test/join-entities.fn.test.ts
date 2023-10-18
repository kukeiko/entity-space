import { joinEntities } from "../lib/entity/join-entities.fn";

describe("joinEntities()", () => {
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

        joinEntities(fooEntities, barEntities, "joined", ["id"], ["fooId"], true);

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

        joinEntities(fooEntities, barEntities, "joined", ["id", "namespace"], ["fooId", "namespace"], true);

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
});
