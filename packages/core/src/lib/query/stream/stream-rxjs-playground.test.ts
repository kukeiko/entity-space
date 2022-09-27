import { inSet, isValueTemplate, matches, namedTemplate } from "@entity-space/criteria";
import { cloneDeep, flatMap, flatten } from "lodash";
import { firstValueFrom, scan, takeLast, tap } from "rxjs";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Expansion } from "../../expansion/expansion";
import { EntitySchema, PrimitiveSchema } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { EntityController } from "./entity-controller";
import { EntityControllerEndpoint } from "./entity-controller-endpoint";
import { EntitySourceGateway } from "./entity-source-gateway";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStreamPacket } from "./query-stream-packet";

describe("playground: stream", () => {
    const fooSchema = new EntitySchema<Foo>("foo")
        .setKey("id")
        .addProperty("name", new PrimitiveSchema("string"))
        .addIndex("barId")
        .addRelation("bar", "barId", "id")
        .addRelation("children", "id", "fooId");

    interface Foo {
        id: number;
        name: string;
        isEven: boolean;
        barId: number;
        bar?: Bar;
        children?: FooChild[];
    }

    interface FooChild {
        id: number;
        name: string;
        fooId: number;
        foo?: Foo;
    }

    const fooChildSchema = new EntitySchema("foo-child")
        .setKey("id")
        .addString("name")
        .addIndex("fooId")
        .addRelation("foo", "fooId", "id")
        .addProperty("foo", fooSchema);

    fooSchema.addArray("children", fooChildSchema);

    interface Bar {
        id: number;
        name: string;
        bazId: number;
        baz?: Baz;
    }

    const barSchema = new EntitySchema("bar")
        .setKey("id")
        .addInteger("id")
        .addProperty("name", new PrimitiveSchema("string"))
        .addIndex("bazId")
        .addRelation("baz", "bazId", "id");

    fooSchema.addProperty("bar", barSchema);

    interface Baz {
        id: number;
        name: string;
    }

    const bazSchema = new EntitySchema("baz").setKey("id").addProperty("name", new PrimitiveSchema("string"));
    barSchema.addProperty("baz", bazSchema);

    const data: { foo: Foo[]; fooChild: FooChild[]; bar: Bar[]; baz: Baz[] } = {
        foo: [
            { id: 1, name: "One", isEven: false, barId: 10 },
            { id: 2, name: "Two", isEven: true, barId: 10 },
            { id: 3, name: "Three", isEven: false, barId: 21 },
            { id: 4, name: "Four", isEven: true, barId: 21 },
        ],
        fooChild: [
            { id: 300, name: "1st Child of Tree", fooId: 3 },
            { id: 301, name: "2nd Child of Tree", fooId: 3 },
            { id: 302, name: "3rd Child of Tree", fooId: 3 },
            { id: 200, name: "Only Child of Two", fooId: 2 },
            { id: 400, name: "1st Child of Four", fooId: 4 },
            { id: 401, name: "2nd Child of Four", fooId: 4 },
        ],
        bar: [
            { id: 10, name: "Bar - 10", bazId: 100 },
            { id: 21, name: "Bar - 21", bazId: 201 },
        ],
        baz: [
            { id: 100, name: "Baz - 100" },
            { id: 201, name: "Baz - 201" },
        ],
    };

    const queryData = <T>(query: Query, data: T[]): T[] => {
        return cloneDeep(query.getCriteria().filter(data));
    };

    class FooAndBarAndFooChildController extends EntityController {
        withLoadFooChildByFooId(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: fooChildSchema,
                    template: namedTemplate({ fooId: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true, fooId: true }),
                    invoke: query => queryData(query, data.fooChild),
                })
            );
        }

        withLoadFooById(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: fooSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, barId: true, isEven: true, name: true }),
                    invoke: query => queryData(query, data.foo),
                })
            );
        }

        withLoadFooByIsEven(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: fooSchema,
                    template: namedTemplate({ isEven: isValueTemplate(Boolean) }),
                    expansion: new Expansion({ id: true, barId: true, isEven: true, name: true }),
                    invoke: query => queryData(query, data.foo),
                })
            );
        }

        withLoadBarById(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: barSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true, bazId: true }),
                    invoke: query => queryData(query, data.bar),
                })
            );
        }

        withLoadBarByEvenId(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: barSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true, bazId: true }),
                    acceptCriterion: criterion => {
                        return criterion.getBag().id.getValue() % 2 === 0 ? criterion : false;
                    },
                    invoke: query => queryData(query, data.bar),
                })
            );
        }

        withLoadBazById(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: bazSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true }),
                    invoke: query => queryData(query, data.baz),
                })
            );
        }

        withLoadBazByEvenId(): this {
            return this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: bazSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true }),
                    acceptCriterion: criterion => {
                        return criterion.getBag().id.getValue() % 2 === 0 ? criterion : false;
                    },
                    invoke: query => queryData(query, data.baz),
                })
            );
        }
    }

    async function queryTest<T>(
        queries: Query<T>[],
        source: IEntitySource_V2,
        opts?: { logEach?: boolean; logFinal?: boolean; logEntities?: boolean }
    ): Promise<T[]> {
        const logEach = opts?.logEach ?? true;
        const logFinal = opts?.logFinal ?? true;
        const logEntities = opts?.logEntities ?? true;
        const cache = new InMemoryEntityDatabase();
        const stream = source.query_v2(queries, cache).pipe(
            tap(packet => {
                if (logEach) {
                    console.log(packet.toString());
                }
            }),
            scan(QueryStreamPacket.concat),
            takeLast(1)
        );

        const aggregatedPacket = await firstValueFrom(stream);

        if (logFinal) {
            const accepted = mergeQueries(...aggregatedPacket.getAcceptedQueries()).map(q => q.toString());
            const rejected = mergeQueries(...aggregatedPacket.getRejectedQueries()).map(q => q.toString());

            console.log("🎯 ✔️ ", JSON.stringify(accepted, void 0, 4));
            console.log("🎯 ❌ ", JSON.stringify(rejected, void 0, 4));
        }

        const entities = flatMap(flatten(queries.map(query => cache.querySync(query))), entities =>
            entities.getEntities()
        );

        if (logEntities) {
            console.log("🎯 📦 ", JSON.stringify(entities));
        }

        return entities as T[];
    }

    fit("simple test - v3", async () => {
        const controller = new FooAndBarAndFooChildController()
            .withLoadFooById()
            .withLoadBarById()
            .withLoadBarByEvenId()
            .withLoadBazById()
            .withLoadBazByEvenId();
        const gateway = new EntitySourceGateway([controller]);
        const queries: Query[] = [
            // [todo] write test using and() - which currently doesn't work because it is not handled in
            // new Query<Foo>(fooSchema, matches<Foo>({ id: inSet([2, 3]), bar: matches<Bar>({ id: [10, 21] }) }), {
            new Query<Foo>(fooSchema, matches<Foo>({ id: inSet([2, 3]) }), {
                id: true,
                name: true,
                bar: { id: true, name: true, baz: true },
            }),
        ];

        // [todo] "isEven: true" is loaded twice because 2nd entity-controller erroneously accepts query where only "bar" is to by hydrated
        const merged = await queryTest(queries, gateway, { logEach: true, logEntities: true });

        // const expected: Foo[] = [
        //     { id: 2, name: "Two", isEven: true, barId: 10, bar: { id: 10, name: "Bar - 10", bazId: 100 } },
        //     { id: 3, name: "Three", isEven: false, barId: 21 },
        //     { id: 4, name: "Four", isEven: true, barId: 21 },
        // ];

        // expect(merged).toEqual(expected);
    });

    it("rxjs how do you work", done => {
        // merge(EMPTY, EMPTY)
        //     .pipe(takeLast(1))
        //     .subscribe({
        //         complete: () => {
        //             console.log("complete!");
        //             done();
        //         },
        //     });
        done();
    });

    it("simple test", async () => {
        // const fooAndBarAndFooChildController = new FooAndBarAndFooChildController().withLoadFooById();
        // const gateway = new EntitySourceGateway_V2([fooAndBarAndFooChildController], [new DefaultHydrator()]);
        // const queries: Query[] = [
        //     new Query<Foo>(fooSchema, or(matches<Foo>({ id: inSet([2, 3]) }), matches<Foo>({ isEven: true })), {
        //         id: true,
        //         name: true,
        //         bar: true,
        //     }),
        // ];
        // const merged = await queryTest(fooSchema, queries, gateway, { logEach: false });
        // const expected: Foo[] = [
        //     { id: 2, name: "Two", isEven: true, barId: 10, bar: { id: 10, name: "Bar - 10", bazId: 100 } },
        //     { id: 3, name: "Three", isEven: false, barId: 21 },
        //     { id: 4, name: "Four", isEven: true, barId: 21 },
        // ];
        // expect(merged).toEqual(expected);
    });

    it("complicated test", async () => {
        // const fooAndBarAndFooChildController = new FooAndBarAndFooChildController().withLoadFooById();
        // const gateway = new EntitySourceGateway_V2([fooAndBarAndFooChildController], [new DefaultHydrator()]);
        // const queries: Query[] = [
        //     new Query<Foo>(
        //         fooSchema,
        //         or(matches<Foo>({ id: inSet([2, 3]), isEven: false }), matches<Foo>({ isEven: true })),
        //         {
        //             id: true,
        //             name: true,
        //             bar: true,
        //             children: { id: true, name: true, foo: true },
        //         }
        //     ),
        // ];
        // const merged = await queryTest(fooSchema, queries, gateway, { logEach: false });
        // const expected = [
        //     {
        //         id: 2,
        //         name: "Two",
        //         isEven: true,
        //         barId: 10,
        //         bar: {
        //             id: 10,
        //             name: "Bar - 10",
        //             bazId: 100,
        //         },
        //         children: [
        //             {
        //                 id: 200,
        //                 name: "Only Child of Two",
        //                 fooId: 2,
        //                 foo: {
        //                     id: 2,
        //                     name: "Two",
        //                     isEven: true,
        //                     barId: 10,
        //                 },
        //             },
        //         ],
        //     },
        //     {
        //         id: 3,
        //         name: "Three",
        //         isEven: false,
        //         barId: 21,
        //         children: [
        //             {
        //                 id: 300,
        //                 name: "1st Child of Tree",
        //                 fooId: 3,
        //                 foo: {
        //                     id: 3,
        //                     name: "Three",
        //                     isEven: false,
        //                     barId: 21,
        //                 },
        //             },
        //             {
        //                 id: 301,
        //                 name: "2nd Child of Tree",
        //                 fooId: 3,
        //                 foo: {
        //                     id: 3,
        //                     name: "Three",
        //                     isEven: false,
        //                     barId: 21,
        //                 },
        //             },
        //             {
        //                 id: 302,
        //                 name: "3rd Child of Tree",
        //                 fooId: 3,
        //                 foo: {
        //                     id: 3,
        //                     name: "Three",
        //                     isEven: false,
        //                     barId: 21,
        //                 },
        //             },
        //         ],
        //     },
        //     {
        //         id: 4,
        //         name: "Four",
        //         isEven: true,
        //         barId: 21,
        //         children: [
        //             {
        //                 id: 400,
        //                 name: "1st Child of Four",
        //                 fooId: 4,
        //                 foo: {
        //                     id: 4,
        //                     name: "Four",
        //                     isEven: true,
        //                     barId: 21,
        //                 },
        //             },
        //             {
        //                 id: 401,
        //                 name: "2nd Child of Four",
        //                 fooId: 4,
        //                 foo: {
        //                     id: 4,
        //                     name: "Four",
        //                     isEven: true,
        //                     barId: 21,
        //                 },
        //             },
        //         ],
        //     },
        // ];
        // expect(merged).toEqual(expected);
    });

    it("expansion test", async () => {
        // const fooAndBarAndFooChildController = new FooAndBarAndFooChildController().withLoadFooById();
        // const gateway = new EntitySourceGateway_V2([fooAndBarAndFooChildController], [new DefaultHydrator()]);
        // const queries: Query[] = [
        //     new Query<Foo>(fooSchema, or(matches<Foo>({ id: inSet([2, 3, 4]) })), {
        //         id: true,
        //         name: true,
        //         bar: true,
        //     }),
        // ];
        // const merged = await queryTest(fooSchema, queries, gateway, { logEach: true });
        // const expected: Foo[] = [
        //     { id: 2, name: "Two", isEven: true, barId: 10, bar: { id: 10, name: "Bar - 10", bazId: 100 } },
        //     { id: 3, name: "Three", isEven: false, barId: 21 },
        //     { id: 4, name: "Four", isEven: true, barId: 21 },
        // ];
        // expect(merged).toEqual(expected);
    });
});
