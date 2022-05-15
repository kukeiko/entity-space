import { EntitySchema } from "../schema/entity-schema";
import { EntitySchemaIndex } from "../schema/entity-schema-index";
import { EntityCompositeValueIndex } from "./entity-composite-value-index";
import { MapPathFn } from "./entity-index.interface";
import { EntityPrimitiveValueIndex } from "./entity-primitive-value-index";

describe("playground: index", () => {
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

        const entitySchema = new EntitySchema("foo");
        const indexSchema = new EntitySchemaIndex(entitySchema, "fooId");
        const index = new EntityPrimitiveValueIndex(indexSchema);

        index.joinEntities({
            fromEntities: fooEntities,
            property: "joined",
            toEntities: barEntities,
            isArray: true,
            mapPath: () => "id",
        });

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

        const entitySchema = new EntitySchema("foo");
        const indexSchema = new EntitySchemaIndex(entitySchema, ["namespace", "fooId"]);
        const index = new EntityCompositeValueIndex(indexSchema);

        const mapPath: MapPathFn = path => {
            switch (path) {
                case "fooId":
                    return "id";
                case "namespace":
                    return "namespace";
                default:
                    throw new Error(`unknown oath ${path}`);
            }
        };

        index.joinEntities({
            fromEntities: fooEntities,
            property: "joined",
            toEntities: barEntities,
            isArray: true,
            mapPath,
        });

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
