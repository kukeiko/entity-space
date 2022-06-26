import { inSet, isValueTemplate, matches, namedTemplate, or } from "@entity-space/criteria";
import { flatMap } from "lodash";
import { firstValueFrom, of, scan, takeLast, tap } from "rxjs";
import { mergeEntities, QueriedEntities } from "../../entity";
import { Expansion } from "../../public";
import { EntitySchema, IEntitySchema, PrimitiveSchema } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { DefaultHydrator } from "./default-hydrator";
import { EntityController } from "./entity-controller";
import { EntityControllerEndpoint } from "./entity-controller-endpoint";
import { EntitySourceGateway_V2 } from "./entity-source-gateway-v2";
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
            { id: 21, name: "Bar - 21", bazId: 200 },
        ],
        baz: [{ id: 100, name: "Baz - 100" }],
    };

    class FooAndBarAndFooChildController extends EntityController {
        constructor() {
            super();

            // load foo by id
            this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: fooSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, barId: true, isEven: true, name: true }),
                    invoke: query => {
                        const entities = query.getCriteria().filter(data.foo);
                        const payload = [new QueriedEntities(query, entities)];
                        return of(new QueryStreamPacket({ payload }));
                    },
                })
            );

            // load foo by isEven
            this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: fooSchema,
                    template: namedTemplate({ isEven: isValueTemplate(Boolean) }),
                    expansion: new Expansion({ id: true, barId: true, isEven: true, name: true }),
                    invoke: query => {
                        const entities = query.getCriteria().filter(data.foo);
                        const payload = [new QueriedEntities(query, entities)];
                        return of(new QueryStreamPacket({ payload }));
                    },
                })
            );

            // load bar by id, but only if id is divisible by 2
            this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: barSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true, bazId: true }),
                    acceptCriterion: criterion => {
                        return criterion.getBag().id.getValue() % 2 === 0 ? criterion : false;
                    },
                    invoke: query => {
                        const entities = query.getCriteria().filter(data.bar);
                        const payload = [new QueriedEntities(query, entities)];
                        return of(new QueryStreamPacket({ payload }));
                    },
                })
            );

            // load baz by id
            this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: bazSchema,
                    template: namedTemplate({ id: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true }),
                    invoke: query => {
                        const entities = query.getCriteria().filter(data.baz);
                        const payload = [new QueriedEntities(query, entities)];
                        return of(new QueryStreamPacket({ payload }));
                    },
                })
            );

            // load foo-child by fooId
            this.addEndpoint(
                new EntityControllerEndpoint({
                    schema: fooChildSchema,
                    template: namedTemplate({ fooId: isValueTemplate(Number) }),
                    expansion: new Expansion({ id: true, name: true, fooId: true }),
                    invoke: query => {
                        const entities = query.getCriteria().filter(data.fooChild);
                        const payload = [new QueriedEntities(query, entities)];
                        return of(new QueryStreamPacket({ payload }));
                    },
                })
            );
        }
    }

    async function queryTest<T>(
        entitySchema: IEntitySchema,
        queries: Query<T>[],
        source: IEntitySource_V2,
        opts?: { logEach?: boolean; logFinal?: boolean }
    ): Promise<T[]> {
        const logEach = opts?.logEach ?? true;
        const logFinal = opts?.logFinal ?? true;

        const stream = source.query([...queries]).pipe(
            tap(packet => {
                if (logEach) {
                    console.log(packet.toString());
                }
            }),
            scan(QueryStreamPacket.merge),
            takeLast(1)
        );

        const aggregatedPacket = await firstValueFrom(stream);

        if (logFinal) {
            const accepted = mergeQueries(...aggregatedPacket.getAcceptedQueries()).map(q => q.toString());
            const rejected = mergeQueries(...aggregatedPacket.getRejectedQueries()).map(q => q.toString());

            console.log("🎯 ✔️", JSON.stringify(accepted, void 0, 4));
            console.log("🎯 ❌", JSON.stringify(rejected, void 0, 4));
        }

        const entities = flatMap(aggregatedPacket.getPayload(), payload => payload.getEntities());
        const clientSideFilteredEntities = queries.reduce(
            (entities, query) => query.getCriteria().filter(entities),
            entities
        );

        const merged = mergeEntities(entitySchema, clientSideFilteredEntities);

        return merged as T[];
    }

    fit("simple test", async () => {
        const fooAndBarAndFooChildController = new FooAndBarAndFooChildController();
        const gateway = new EntitySourceGateway_V2([fooAndBarAndFooChildController], [new DefaultHydrator()]);

        const queries: Query[] = [
            new Query<Foo>(fooSchema, or(matches<Foo>({ id: inSet([2, 3]) }), matches<Foo>({ isEven: true })), {
                id: true,
                name: true,
                bar: true,
            }),
        ];

        const merged = await queryTest(fooSchema, queries, gateway, { logEach: false });

        const expected: Foo[] = [
            { id: 2, name: "Two", isEven: true, barId: 10, bar: { id: 10, name: "Bar - 10", bazId: 100 } },
            { id: 3, name: "Three", isEven: false, barId: 21 },
            { id: 4, name: "Four", isEven: true, barId: 21 },
        ];

        expect(merged).toEqual(expected);
    });

    it("complicated test", async () => {
        const fooAndBarAndFooChildController = new FooAndBarAndFooChildController();
        const gateway = new EntitySourceGateway_V2([fooAndBarAndFooChildController], [new DefaultHydrator()]);

        const queries: Query[] = [
            new Query<Foo>(
                fooSchema,
                or(matches<Foo>({ id: inSet([2, 3]), isEven: false }), matches<Foo>({ isEven: true })),
                {
                    id: true,
                    name: true,
                    bar: true,
                    children: { id: true, name: true, foo: true },
                }
            ),
        ];

        const merged = await queryTest(fooSchema, queries, gateway, { logEach: false });
        const expected = [
            {
                id: 2,
                name: "Two",
                isEven: true,
                barId: 10,
                bar: {
                    id: 10,
                    name: "Bar - 10",
                    bazId: 100,
                },
                children: [
                    {
                        id: 200,
                        name: "Only Child of Two",
                        fooId: 2,
                        foo: {
                            id: 2,
                            name: "Two",
                            isEven: true,
                            barId: 10,
                        },
                    },
                ],
            },
            {
                id: 3,
                name: "Three",
                isEven: false,
                barId: 21,
                children: [
                    {
                        id: 300,
                        name: "1st Child of Tree",
                        fooId: 3,
                        foo: {
                            id: 3,
                            name: "Three",
                            isEven: false,
                            barId: 21,
                        },
                    },
                    {
                        id: 301,
                        name: "2nd Child of Tree",
                        fooId: 3,
                        foo: {
                            id: 3,
                            name: "Three",
                            isEven: false,
                            barId: 21,
                        },
                    },
                    {
                        id: 302,
                        name: "3rd Child of Tree",
                        fooId: 3,
                        foo: {
                            id: 3,
                            name: "Three",
                            isEven: false,
                            barId: 21,
                        },
                    },
                ],
            },
            {
                id: 4,
                name: "Four",
                isEven: true,
                barId: 21,
                children: [
                    {
                        id: 400,
                        name: "1st Child of Four",
                        fooId: 4,
                        foo: {
                            id: 4,
                            name: "Four",
                            isEven: true,
                            barId: 21,
                        },
                    },
                    {
                        id: 401,
                        name: "2nd Child of Four",
                        fooId: 4,
                        foo: {
                            id: 4,
                            name: "Four",
                            isEven: true,
                            barId: 21,
                        },
                    },
                ],
            },
        ];

        expect(merged).toEqual(expected);
    });
});
