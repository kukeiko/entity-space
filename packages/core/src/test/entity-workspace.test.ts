import { firstValueFrom, take, tap, toArray } from "rxjs";
import { UnpackedEntitySelection } from "../lib/common/unpacked-entity-selection.type";
import { ICriterion } from "../lib/criteria/criterion.interface";
import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { EntitySpaceServices } from "../lib/execution/entity-space-services";
import { EntityWorkspace } from "../lib/execution/entity-workspace";
import { EntityQueryTools } from "../lib/query/entity-query-tools";
import { IEntityQuery } from "../lib/query/entity-query.interface";
import { EntitySchema } from "../lib/schema/entity-schema";
import { IEntitySchema } from "../lib/schema/schema.interface";

function createWorkspace(): EntityWorkspace {
    return new EntityWorkspace(new EntitySpaceServices());
}

function createQuery(
    entitySchema: IEntitySchema,
    criteria: ICriterion,
    expansion: UnpackedEntitySelection = {}
): IEntityQuery {
    return new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() }).createQuery({
        entitySchema,
        criteria,
        selection: expansion,
    });
}

describe("EntityWorkspace", () => {
    const criteriaFactory = new EntityCriteriaTools();
    const { where, inArray } = criteriaFactory;

    describe("querying against cache", () => {
        it("should work using 1 simple index", () => {
            // arrange
            interface Entity {
                id: number;
                bar: number;
            }

            const schema = new EntitySchema("foo")
                .addInteger("id", true)
                .setKey("id")
                .addInteger("bar", true)
                .addIndex("bar");
            const workspace = createWorkspace();

            const entities: Entity[] = [
                { id: 1, bar: 2 },
                { id: 2, bar: 3 },
                { id: 3, bar: 2 },
                { id: 4, bar: 1 },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: 2 },
                { id: 2, bar: 3 },
                { id: 3, bar: 2 },
            ];

            workspace.add(schema, entities);

            // act
            const query = createQuery(schema, where<Entity>({ bar: inArray([2, 3]) }));
            const result = workspace.getContext().getDatabase().querySync(query).getEntities();

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should work using 1 composite index", () => {
            // arrange
            interface Entity {
                id: number;
                bar: number;
                baz: number;
            }

            const fooSchema = new EntitySchema("foo")
                .addInteger("id", true)
                .setKey("id")
                .addInteger("bar", true)
                .addInteger("baz", true)
                .addIndex(["bar", "baz"], { name: "bar-baz" });
            const workspace = createWorkspace();

            const entities: Entity[] = [
                { id: 1, bar: 2, baz: 1337 },
                { id: 2, bar: 3, baz: 1337 },
                { id: 3, bar: 2, baz: 64 },
                { id: 4, bar: 1, baz: 1337 },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: 2, baz: 1337 },
                { id: 2, bar: 3, baz: 1337 },
            ];

            workspace.add(fooSchema, entities);

            // act
            const query = createQuery(fooSchema, where<Entity>({ bar: inArray([2, 3]), baz: inArray([1337]) }));
            const result = workspace.getContext().getDatabase().querySync(query).getEntities();

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should work using 1 nested index", () => {
            // arrange
            interface Entity {
                id: number;
                bar: { baz: number };
            }

            const fooSchema = new EntitySchema("foo").addInteger("id", true).setKey("id").addIndex("bar.baz");
            const barSchema = new EntitySchema("bar").addInteger("baz", true);
            fooSchema.addProperty("bar", barSchema);

            const workspace = createWorkspace();

            const entities: Entity[] = [
                { id: 1, bar: { baz: 2 } },
                { id: 2, bar: { baz: 3 } },
                { id: 3, bar: { baz: 2 } },
                { id: 4, bar: { baz: 1 } },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: { baz: 2 } },
                { id: 2, bar: { baz: 3 } },
                { id: 3, bar: { baz: 2 } },
            ];

            workspace.add(fooSchema, entities);

            // act
            const query = createQuery(fooSchema, where<Entity>({ bar: where({ baz: inArray([2, 3]) }) }));
            const result = workspace.getContext().getDatabase().querySync(query).getEntities();

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should work using 1 composite nested index", () => {
            // arrange
            interface Entity {
                id: number;
                bar: {
                    baz: number;
                    moo: number;
                };
            }
            const fooSchema = new EntitySchema("foo")
                .addInteger("id", true)
                .setKey("id")
                .addIndex(["bar.baz", "bar.moo"], { name: "bar" });

            const barSchema = new EntitySchema("bar").addInteger("baz", true).addInteger("moo", true);
            fooSchema.addProperty("bar", barSchema);

            const workspace = createWorkspace();

            const entities: Entity[] = [
                { id: 1, bar: { baz: 2, moo: 10 } },
                { id: 2, bar: { baz: 3, moo: 10 } },
                { id: 3, bar: { baz: 2, moo: 5 } },
                { id: 4, bar: { baz: 1, moo: 5 } },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: { baz: 2, moo: 10 } },
                { id: 2, bar: { baz: 3, moo: 10 } },
            ];

            workspace.add(fooSchema, entities);

            // act
            const query = createQuery(
                fooSchema,
                where<Entity>({ bar: where({ baz: inArray([2, 3]), moo: inArray([10]) }) })
            );
            const result = workspace.getContext().getDatabase().querySync(query).getEntities();

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should work using 1 composite distributed nested index", () => {
            // arrange
            interface Entity {
                id: number;
                bar: {
                    baz: number;
                    moo: number;
                };
                khaz: {
                    mo: number;
                    dan: number;
                };
            }

            const fooSchema = new EntitySchema("foo")
                .addInteger("id", true)
                .setKey("id")
                .addIndex(["bar.baz", "bar.moo", "khaz.mo", "khaz.dan"], { name: "bar" });

            const barSchema = new EntitySchema("bar").addInteger("baz", true).addInteger("moo", true);
            const khazSchema = new EntitySchema("khaz").addInteger("mo", true).addInteger("dan", true);
            fooSchema.addProperty("bar", barSchema).addProperty("khaz", khazSchema);

            const workspace = createWorkspace();

            const entities: Entity[] = [
                { id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } },
                { id: 2, bar: { baz: 3, moo: 10 }, khaz: { mo: 1, dan: 3 } },
                { id: 3, bar: { baz: 2, moo: 5 }, khaz: { mo: 1, dan: 2 } },
                { id: 4, bar: { baz: 1, moo: 5 }, khaz: { mo: 1, dan: 2 } },
            ];

            const expectedEntities: Entity[] = [{ id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } }];

            workspace.add(fooSchema, entities);

            // act
            const query = createQuery(
                fooSchema,
                where<Entity>({
                    bar: where({ baz: inArray([2, 3]), moo: inArray([10]) }),
                    khaz: where({ mo: inArray([1]), dan: inArray([2]) }),
                })
            );

            const result = workspace.getContext().getDatabase().querySync(query).getEntities();

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });
    });

    describe("selections", () => {
        it("selecting on 1x composite index", () => {
            const fooSchema = new EntitySchema("foo")
                .addInteger("id", true)
                .addInteger("secondaryId", true)
                .setKey(["id", "secondaryId"]);

            const barSchema = new EntitySchema("bar")
                .addInteger("id", true)
                .setKey("id")
                .addInteger("secondaryId", true)
                .addInteger("fooId", true)
                .addIndex(["fooId", "secondaryId"], { name: "fooId" });

            fooSchema.addProperty("bar", barSchema);
            // [todo] unintuitive usage of auto computed index name
            fooSchema.addRelation("bar", ["id", "secondaryId"], ["fooId", "secondaryId"]);

            const workspace = createWorkspace();

            workspace.add(fooSchema, [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
            workspace.add(barSchema, [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

            const query = createQuery(fooSchema, where({ id: inArray([1337]), secondaryId: inArray([128]) }), {
                bar: true,
            });
            const fooItems = workspace.getContext().getDatabase().querySync(query).getEntities();

            expect(fooItems).toEqual([
                {
                    id: 1337,
                    secondaryId: 128,
                    name: "i am foo",
                    bar: { id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" },
                },
            ]);
        });

        // [todo] i need a less confusing name for entities that are contained in other entities,
        // but are not part of a relation, i.e. not normalized/joinable/...
        it("expanding on a relation of an entity which itself is not related", () => {
            // arrange
            const fooSchema = new EntitySchema("foo").addInteger("id", true).setKey("id");
            const barSchema = new EntitySchema("bar").addInteger("bazId", true).addIndex("bazId");
            const bazSchema = new EntitySchema("baz").addInteger("id", true).setKey("id");
            barSchema.addRelationProperty("baz", bazSchema, ["bazId"], ["id"]);
            fooSchema.addProperty("bar", barSchema);

            const workspace = createWorkspace();
            workspace.add(fooSchema, [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
            workspace.add(bazSchema, [{ id: 128, name: "i am baz" }]);

            // act
            const query = createQuery(fooSchema, where({ id: inArray([1337]) }), { bar: { baz: true } });
            const fooItems = workspace.getContext().getDatabase().querySync(query).getEntities();

            // assert
            expect(fooItems).toEqual([
                { id: 1337, name: "i am foo", bar: { bazId: 128, baz: { id: 128, name: "i am baz" } } },
            ]);
        });
    });

    it("normalize items, add them to store, then query", () => {
        // arrange
        interface Foo {
            bar: Bar;
            barId: number;
            id: number;
        }

        interface Bar {
            baz?: Baz;
            bazId: number;
            id: number;
        }

        interface Baz {
            id: number;
        }

        const fooSchema = new EntitySchema("foo")
            .addInteger("id", true)
            .setKey("id")
            .addIndex("barId")
            .addInteger("barId", true);

        const barSchema = new EntitySchema("bar")
            .addInteger("id", true)
            .setKey("id")
            .addInteger("bazId", true)
            .addIndex("bazId");

        const bazSchema = new EntitySchema("baz").addInteger("id").setKey("id");
        fooSchema.addRelationProperty("bar", barSchema, ["barId"], ["id"]);
        barSchema.addRelationProperty("baz", bazSchema, ["bazId"], ["id"]);

        const workspace = createWorkspace();

        const addedItems: Foo[] = [
            {
                id: 1337,
                barId: 64,
                bar: {
                    id: 64,
                    bazId: 128,
                    baz: {
                        id: 128,
                    },
                },
            },
        ];

        // act
        workspace.add(fooSchema, addedItems);

        const query = createQuery(fooSchema, where({ id: inArray([1337]) }), { bar: { baz: true } });
        const queriedItems = workspace.getContext().getDatabase().querySync(query).getEntities();

        // assert
        expect(queriedItems).toEqual(addedItems);
    });

    // [todo] deactivated because a lot of changes broke it. keeping it as a reference on how to write reactive queries tests in the future,
    // as it is quite easy to understand how it works.
    xdescribe("reactive queries", () => {
        const timeout = 100;

        it(
            "should work #1",
            async () => {
                // arrange
                interface Entity {
                    id: number;
                    name: string;
                }

                const entitySchema = new EntitySchema<Entity>("foo")
                    .addInteger("id", true)
                    .setKey("id")
                    .addString("name");
                const workspace = createWorkspace();
                const entities: Entity[] = [
                    { id: 1, name: "one" },
                    { id: 2, name: "two" },
                ];
                const changes: Partial<Entity>[] = [
                    {
                        id: 1,
                        name: "one (update)",
                    },
                ];
                const expectedEntities: Entity[] = [
                    { id: 1, name: "one (update)" },
                    { id: 2, name: "two" },
                ];
                workspace.add<Entity>(entitySchema, entities);

                // act / assert
                let index = 0;
                const actual = await firstValueFrom(
                    // workspace.query$<Entity>(entitySchema, { id: inArray([1, 2]) }).pipe(
                    workspace
                        .fromSchema(entitySchema)
                        .where({ id: [1, 2] })
                        .findAll()
                        .pipe(
                            // [todo] should also make assertion against entities we just received
                            tap(() => workspace.add<Entity>(entitySchema, changes[index++] ?? [])),
                            take(changes.length + 1),
                            toArray()
                        )
                );

                expect(actual).toEqual([entities, expectedEntities]);
            },
            timeout
        );
    });
});
