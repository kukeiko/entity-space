import { EntityCompositeValueIndex } from "./entity-composite-value-index";
import { EntityPrimitiveValueIndex } from "./entity-primitive-value-index";

describe("playground: index", () => {
    it("primitive index", () => {
        interface Entity {
            foo: { bar: { baz: number | string } };
        }

        const entities: Entity[] = [
            { foo: { bar: { baz: 1 } } },
            { foo: { bar: { baz: 2 } } },
            { foo: { bar: { baz: -1 } } },
            { foo: { bar: { baz: 1 } } },
            { foo: { bar: { baz: "2" } } },
        ];
        const index = new EntityPrimitiveValueIndex();
        index.path = "foo.bar.baz";
        const criterion = index.getCriterion(entities);
        expect(criterion.toString()).toEqual(`{ foo: { bar: { baz: {1, 2, -1, "2"} } } }`);
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

        const index = new EntityPrimitiveValueIndex();
        index.path = "fooId";
        index.joinEntities(barEntities, fooEntities, true, () => "id", "joined");

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

    it("composite index", () => {
        interface Entity {
            foo: { bar: { baz: number } };
            cheese: number;
            khaz: { mo: number };
        }

        const index = new EntityCompositeValueIndex();
        index.paths = ["foo.bar.baz", "cheese", "khaz.mo"];
        const entities: Entity[] = [
            {
                foo: { bar: { baz: 1 } },
                cheese: 10,
                khaz: { mo: 100 },
            },
            {
                foo: { bar: { baz: 1 } },
                cheese: 10,
                khaz: { mo: 200 },
            },
            {
                foo: { bar: { baz: 1 } },
                cheese: 20,
                khaz: { mo: 100 },
            },
            {
                foo: { bar: { baz: 1 } },
                cheese: 20,
                khaz: { mo: 200 },
            },
            {
                foo: { bar: { baz: 2 } },
                cheese: 10,
                khaz: { mo: 100 },
            },
        ];

        const criterion = index.getCriterion(entities);

        /**
         * [todo]
         * { foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } }
         * could be simplified to
         * { foo: { bar: { baz: 1 } }, cheese: {10, 20}, khaz: { mo: {100, 200} } }
         */
        expect(criterion.toString()).toEqual(
            "({ foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 2 } }, cheese: 10, khaz: { mo: {100} } })"
        );
        console.log(criterion.toString());
    });

    it("composite index (mapped path)", () => {
        interface Entity {
            "foo-bar-baz": number;
            tasty: { cheese: number };
            "khaz-mo": number;
        }

        const index = new EntityCompositeValueIndex();
        index.paths = ["foo.bar.baz", "cheese", "khaz.mo"];

        const entities: Entity[] = [
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 10 },
                "khaz-mo": 100,
            },
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 10 },
                "khaz-mo": 200,
            },
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 20 },
                "khaz-mo": 100,
            },
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 20 },
                "khaz-mo": 200,
            },
            {
                "foo-bar-baz": 2,
                tasty: { cheese: 10 },
                "khaz-mo": 100,
            },
        ];

        const mapPath = (path: string): string => {
            switch (path) {
                case "foo.bar.baz":
                    return "foo-bar-baz";
                case "cheese":
                    return "tasty.cheese";
                case "khaz.mo":
                    return "khaz-mo";
                default:
                    throw new Error(`unknown path ${path}`);
            }
        };

        const criterion = index.getCriterion(entities, mapPath);

        /**
         * [todo]
         * { foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } }
         * could be simplified to
         * { foo: { bar: { baz: 1 } }, cheese: {10, 20}, khaz: { mo: {100, 200} } }
         */
        expect(criterion.toString()).toEqual(
            "({ foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 2 } }, cheese: 10, khaz: { mo: {100} } })"
        );
        console.log(criterion.toString());
    });

    fit("composite index: join", () => {
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

        const index = new EntityCompositeValueIndex();
        index.paths = ["namespace", "fooId"];
        index.joinEntities(
            barEntities,
            fooEntities,
            true,
            path => {
                switch (path) {
                    case "fooId":
                        return "id";
                    case "namespace":
                        return "namespace";
                    default:
                        throw new Error(`unknown oath ${path}`);
                }
            },
            "joined"
        );

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
