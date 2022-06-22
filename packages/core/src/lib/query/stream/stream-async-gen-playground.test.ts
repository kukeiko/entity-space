import {
    and,
    Criterion,
    fromDeepBag,
    ICriterionTemplate,
    inSet,
    InstancedCriterionTemplate,
    isValueTemplate,
    matches,
    namedTemplate,
} from "@entity-space/criteria";
import { tramplePath } from "@entity-space/utils";
import { cloneDeep, flatMap, flatten } from "lodash";
import { Entity, mergeEntities, QueriedEntities } from "../../entity";
import { createCriterionFromEntities } from "../../entity/functions/create-criterion-from-entities.fn";
import { joinEntities } from "../../entity/functions/join-entities.fn";
import { ExpansionObject } from "../../expansion/expansion-object";
import { Expansion } from "../../public";
import { EntitySchema, IEntitySchemaRelation, PrimitiveSchema } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { reduceQueries } from "../reduce-queries.fn";

describe("playground: stream", () => {
    class QueryError<T extends Entity = Entity> {
        constructor(query: Query<T>, error: unknown) {}
    }

    function foo(foo: readonly number[]) {}

    // [todo] investigate this idea - for each class that just wraps data (such as QueryResult), have a Struct/Json interface
    // that is implemented by the class
    interface QueryResult_Struct_or_Json_decide_later {
        readonly queries: readonly Query[];
    }

    class QueryStreamPacket<T extends Entity = Entity> {
        constructor({
            accepted,
            rejected,
            errors,
            payload,
        }: {
            accepted?: Query<T>[];
            rejected?: Query<T>[];
            errors?: QueryError<T>[];
            payload?: QueriedEntities<T>[];
        }) {
            this.accepted = accepted ?? [];
            this.rejected = rejected ?? [];
            this.errors = errors ?? [];
            // this.payload = payload ?? [];
            // [todo] only temporary cause too lazy to replicate at each IEntitySource_V2
            this.payload = (payload ?? []).map(qe => new QueriedEntities(qe.getQuery(), cloneDeep(qe.getEntities())));
        }

        private readonly accepted: Query<T>[];
        private readonly rejected: Query<T>[];
        private readonly errors: QueryError<T>[];
        private readonly payload: QueriedEntities<T>[];

        getEntitiesFlat(): T[] {
            return flatMap(this.payload, queriedEntities => queriedEntities.getEntities());
        }

        getAcceptedQueries(): Query[] {
            return this.accepted.slice();
        }

        getRejectedQueries(): Query[] {
            return this.rejected.slice();
        }

        getPayload(): QueriedEntities<T>[] {
            return this.payload.slice();
        }

        getErrors(): QueryError<T>[] {
            return this.errors.slice();
        }

        toString(): string {
            const accepted = this.accepted.length == 0 ? "" : "✔️ " + this.accepted.join(",");
            const rejected = this.rejected.length == 0 ? "" : "❌ " + this.rejected.join(",");
            const entities = this.getEntitiesFlat().length == 0 ? "" : "📦 " + JSON.stringify(this.getEntitiesFlat());

            return [accepted, rejected, entities].filter(str => str.length > 0).join(", ");
        }
    }

    type QueryStream<T extends Entity = Entity> = AsyncGenerator<QueryStreamPacket<T>, void, void>;

    interface IEntitySource_V2 {
        acceptQuery?(query: Query): boolean;
        query_strict?<T extends Entity = Entity>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T>;
        query<T extends Entity = Entity>(query: Query<T>[], cancel?: Promise<unknown>): QueryStream<T>;
    }

    interface IEntityHydrator {
        hydrate<T extends Entity = Entity>(
            queriedEntities: QueriedEntities<T>[],
            // schema: IEntitySchema,
            // entities: T[],
            // expansion: Expansion,
            source: IEntitySource_V2
        ): QueryStream<T>;
    }

    fit("foo", async () => {
        const fooSchema = new EntitySchema("foo")
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

        const allFooEntities: Foo[] = [
            { id: 1, name: "One", isEven: false, barId: 10 },
            { id: 2, name: "Two", isEven: true, barId: 10 },
            { id: 3, name: "Three", isEven: false, barId: 21 },
            { id: 4, name: "Four", isEven: true, barId: 21 },
        ];

        const allFooChilEntities: FooChild[] = [
            { id: 300, name: "1st Child of Tree", fooId: 3 },
            { id: 301, name: "2nd Child of Tree", fooId: 3 },
            { id: 302, name: "3rd Child of Tree", fooId: 3 },
            { id: 200, name: "Only Child of Two", fooId: 2 },
            { id: 400, name: "1st Child of Four", fooId: 4 },
            { id: 401, name: "2nd Child of Four", fooId: 4 },
        ];

        const allBarEntities: Bar[] = [
            { id: 10, name: "Bar - 10", bazId: 100 },
            { id: 21, name: "Bar - 21", bazId: 200 },
        ];
        const allBazEntities: Baz[] = [{ id: 100, name: "Baz - 100" }];

        abstract class DefaultEntitySource implements IEntitySource_V2 {
            async *query<T>(queries: Query<T>[], cancel?: Promise<unknown>): QueryStream<T> {
                const accepted: Query<T>[] = [];

                for (const query of queries) {
                    for await (const packet of this.queryOne(query, cancel)) {
                        yield new QueryStreamPacket<T>({
                            accepted: packet.getAcceptedQueries(),
                            errors: packet.getErrors(),
                            payload: packet.getPayload(),
                        });

                        accepted.push(...packet.getAcceptedQueries());
                    }

                    // const open = reduceQueries(queries, accepted) || queries;

                    // if (open.length == 0) {
                    //     return;
                    // }
                }
            }

            protected abstract queryOne<T>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T>;
        }

        class LoadFooByIdSource extends DefaultEntitySource implements IEntitySource_V2 {
            protected async *queryOne<T>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T> {
                if (query.getEntitySchema().getId() !== fooSchema.getId()) {
                    return;
                }

                // [todo] no type completion to "Foo"
                const template = namedTemplate({ id: isValueTemplate(Number) });
                const remapped = template.remap(query.getCriteria());

                if (remapped === false) {
                    return;
                }

                const supportedExpansion: ExpansionObject<Foo> = {
                    id: true,
                    isEven: true,
                    name: true,
                };

                // [todo] should be calculated instead
                const effectiveExpansion = supportedExpansion;

                const accepted = mergeQueries(
                    ...remapped.getCriteria().map(criterion => new Query(fooSchema, criterion, effectiveExpansion))
                );

                const rejected = remapped
                    .getOpen()
                    .map(criterion => new Query(fooSchema, criterion, query.getExpansion()));

                yield new QueryStreamPacket<T>({ accepted, rejected });

                // load from api...
                const all = allFooEntities as unknown as T[];
                const matches = query.getCriteria().filter(all);

                if (!matches.length) {
                    return;
                }

                const payload = accepted.map(query => new QueriedEntities(query, matches));
                yield new QueryStreamPacket<T>({ payload });
            }
        }

        class LoadFooByIsEvenSource extends DefaultEntitySource implements IEntitySource_V2 {
            protected async *queryOne<T>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T> {
                if (query.getEntitySchema().getId() !== fooSchema.getId()) {
                    return;
                }

                // [todo] no type completion to "Foo"
                const remapped = namedTemplate({ isEven: isValueTemplate(Boolean) }).remap(query.getCriteria());

                if (!remapped) {
                    return;
                }

                const accepted = remapped
                    .getCriteria()
                    .map(criterion => new Query(fooSchema, criterion, query.getExpansion()));

                yield new QueryStreamPacket<T>({ accepted });

                // load from api...
                const all = allFooEntities as unknown as T[];
                const matches = query.getCriteria().filter(all);

                if (!matches.length) {
                    return;
                }

                const payload = accepted.map(query => new QueriedEntities(query, matches));
                yield new QueryStreamPacket<T>({ payload });
            }
        }

        class LoadBarByIdSource extends DefaultEntitySource implements IEntitySource_V2 {
            protected async *queryOne<T>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T> {
                if (query.getEntitySchema().getId() !== barSchema.getId()) {
                    return;
                }

                // [todo] no type completion to "Foo"
                const template = namedTemplate({ id: isValueTemplate(Number) });
                const remapped = template.remap(query.getCriteria());

                if (remapped === false) {
                    return;
                }

                const supportedExpansion: ExpansionObject<Bar> = {
                    id: true,
                    name: true,
                    bazId: true,
                };

                // [todo] should be calculated instead
                const effectiveExpansion = supportedExpansion;

                const accepted = remapped
                    .getCriteria()
                    .filter(c => c.getBag().id.getValue() % 2 === 0)
                    .map(criterion => new Query(barSchema, criterion, effectiveExpansion));

                const openRejected = remapped
                    .getOpen()
                    .map(criterion => new Query(barSchema, criterion, query.getExpansion()));

                const rejected = [
                    ...openRejected,
                    ...remapped
                        .getCriteria()
                        .filter(c => c.getBag().id.getValue() % 2 === 1)
                        .map(criterion => new Query(barSchema, criterion, effectiveExpansion)),
                ];

                yield new QueryStreamPacket<T>({ accepted, rejected });

                // load from api...
                const all = allBarEntities as unknown as T[];
                const matches = query.getCriteria().filter(all);

                if (!matches.length) {
                    return;
                }

                const payload = accepted.map(query => new QueriedEntities(query, matches));
                yield new QueryStreamPacket<T>({ payload });
            }
        }

        class LoadBazByIdSource extends DefaultEntitySource implements IEntitySource_V2 {
            protected async *queryOne<T>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T> {
                if (query.getEntitySchema().getId() !== bazSchema.getId()) {
                    return;
                }

                // [todo] no type completion to "Foo"
                const template = namedTemplate({ id: isValueTemplate(Number) });
                const remapped = template.remap(query.getCriteria());

                if (remapped === false) {
                    return;
                }

                const supportedExpansion: ExpansionObject<Baz> = {
                    id: true,
                    name: true,
                };

                // [todo] should be calculated instead
                const effectiveExpansion = supportedExpansion;

                const accepted = remapped
                    .getCriteria()
                    // .filter(c => c.getBag().id.getValue() % 2 === 0)
                    .map(criterion => new Query(bazSchema, criterion, effectiveExpansion));

                const openRejected = remapped
                    .getOpen()
                    .map(criterion => new Query(bazSchema, criterion, query.getExpansion()));

                const rejected = [
                    ...openRejected,
                    ...remapped
                        .getCriteria()
                        // .filter(c => c.getBag().id.getValue() % 2 === 1)
                        .map(criterion => new Query(barSchema, criterion, effectiveExpansion)),
                ];

                yield new QueryStreamPacket<T>({ accepted, rejected });

                // load from api...
                const all = allBazEntities as unknown as T[];
                const matches = query.getCriteria().filter(all);

                if (!matches.length) {
                    return;
                }

                const payload = accepted.map(query => new QueriedEntities(query, matches));
                yield new QueryStreamPacket<T>({ payload });
            }
        }

        class LoadFooChildByFooIdSource extends DefaultEntitySource implements IEntitySource_V2 {
            protected async *queryOne<T>(query: Query<T>, cancel?: Promise<unknown>): QueryStream<T> {
                if (query.getEntitySchema().getId() !== fooChildSchema.getId()) {
                    return;
                }

                // [todo] no type completion to "Foo"
                const template = namedTemplate({ fooId: isValueTemplate(Number) });
                const remapped = template.remap(query.getCriteria());

                if (remapped === false) {
                    return;
                }

                const supportedExpansion: ExpansionObject<FooChild> = {
                    id: true,
                    name: true,
                    fooId: true,
                };

                // [todo] should be calculated instead
                const effectiveExpansion = supportedExpansion;

                const accepted = remapped
                    .getCriteria()
                    // .filter(c => c.getBag().id.getValue() % 2 === 0)
                    .map(criterion => new Query(fooChildSchema, criterion, effectiveExpansion));

                const openRejected = remapped
                    .getOpen()
                    .map(criterion => new Query(fooChildSchema, criterion, query.getExpansion()));

                const rejected = [
                    ...openRejected,
                    ...remapped
                        .getCriteria()
                        // .filter(c => c.getBag().id.getValue() % 2 === 1)
                        .map(criterion => new Query(barSchema, criterion, effectiveExpansion)),
                ];

                yield new QueryStreamPacket<T>({ accepted, rejected });

                // load from api...
                const all = allFooChilEntities as unknown as T[];
                const matches = query.getCriteria().filter(all);

                if (!matches.length) {
                    return;
                }

                const payload = accepted.map(query => new QueriedEntities(query, matches));
                yield new QueryStreamPacket<T>({ payload });
            }
        }

        class EntitySourceGateway_V2 implements IEntitySource_V2 {
            constructor(sources: IEntitySource_V2[] = [], hydrators: IEntityHydrator[] = []) {
                this.sources = sources.slice();
                this.hydrators = hydrators.slice();
            }

            private sources: IEntitySource_V2[];
            private hydrators: IEntityHydrator[];

            async *query<T>(queries: Query<T>[], cancel?: Promise<unknown>): QueryStream<T> {
                const candidates = this.sources.slice();
                const accepted: Query<T>[] = [];
                const payload: QueriedEntities<T>[] = [];

                for (const candidate of candidates) {
                    for await (const packet of candidate.query(queries, cancel)) {
                        yield new QueryStreamPacket<T>({
                            accepted: packet.getAcceptedQueries(),
                            errors: packet.getErrors(),
                            payload: packet.getPayload(),
                        });

                        accepted.push(...packet.getAcceptedQueries());
                        payload.push(...packet.getPayload());
                    }

                    const open = reduceQueries(queries, accepted) || queries;

                    if (open.length == 0) {
                        return;
                    }

                    queries = open;
                }

                const rejected = reduceQueries(queries, accepted) || queries;

                const openExpansionQueries = flatten(
                    rejected.map(query => {
                        const withoutExpansion = query.withoutExpansion();
                        const reduced = reduceQueries([withoutExpansion], accepted);

                        if (reduced) {
                            return (reduceQueries([withoutExpansion], reduced) || [withoutExpansion]).map(
                                reducedQuery =>
                                    new Query(query.getEntitySchema(), reducedQuery.getCriteria(), query.getExpansion())
                            );
                        }

                        return [];
                    })
                );

                const flatPayload = flatten(payload.map(p => p.getEntities()));
                const acceptedExpansionQueries: Query<T>[] = [];

                for (const openExpansionQuery of openExpansionQueries) {
                    console.log(`delegating to hydrator: ${openExpansionQuery}`);
                    const entities = openExpansionQuery.getCriteria().filter(flatPayload);

                    for (const hydrator of this.hydrators) {
                        const queriedEntities = new QueriedEntities(openExpansionQuery, entities);

                        for await (const packet of hydrator.hydrate([queriedEntities], this)) {
                            acceptedExpansionQueries.push(...packet.getAcceptedQueries());
                            yield packet;
                        }
                    }
                }

                const rejectedFinal = reduceQueries(queries, [...accepted, ...acceptedExpansionQueries]) || queries;

                if (rejected.length > 0) {
                    yield new QueryStreamPacket<T>({
                        // rejected: reduceQueries(queries, accepted) || queries,
                        rejected: rejectedFinal,
                    });
                }
            }
        }

        async function* expandRelation<T extends Entity = Entity>(
            queriedEntities: QueriedEntities<T>,
            relation: IEntitySchemaRelation,
            source: IEntitySource_V2,
            expansion?: ExpansionObject
        ): QueryStream<T> {
            const relatedSchema = relation.getRelatedEntitySchema();
            // console.log(relatedSchema.getId());
            // [todo] what about dictionaries?
            const isArray = relation.getProperty().getValueSchema().schemaType === "array";
            const fromIndex = relation.getFromIndex();
            const toIndex = relation.getToIndex();
            const criteria = createCriterionFromEntities(
                queriedEntities.getEntities(),
                fromIndex.getPath(),
                toIndex.getPath()
            );
            const query = new Query(relatedSchema, criteria, expansion ?? {});
            const result: Entity[] = [];
            const accepted: Query<T>[] = [];

            for await (const packet of source.query([query])) {
                result.push(...packet.getEntitiesFlat());
                accepted.push(...packet.getAcceptedQueries());
            }

            // [todo] see if any deeper expansions have been rejected
            const rejected = reduceQueries([query], accepted) || [query];
            let finalRejected: Query<T>[] = [];
            let finalAccepted: Query<T>[] = [];

            if (Query.equivalentCriteria(query, ...mergeQueries(...accepted))) {
                if (rejected.length && accepted.length) {
                    const rejectedExpansion = Expansion.mergeObjects(...rejected.map(q => q.getExpansionObject()));
                    const trampledRejected = {};
                    tramplePath(relation.getPropertyName(), trampledRejected, rejectedExpansion);
                    finalRejected = [queriedEntities.getQuery().withExpansion(trampledRejected)];
                    const successfulExpansion = Expansion.mergeObjects(...accepted.map(q => q.getExpansionObject()));
                    const trampledSuccessful = {};
                    tramplePath(relation.getPropertyName(), trampledSuccessful, successfulExpansion);
                    finalAccepted = [queriedEntities.getQuery().withExpansion(trampledSuccessful)];
                } else if (accepted.length) {
                    finalAccepted = [queriedEntities.getQuery()];
                } else if (rejected.length) {
                    finalRejected = [queriedEntities.getQuery()];
                }
            } else {
                const queriedQuery = queriedEntities.getQuery();

                // [todo] epansion missing!
                for (const acceptedQuery of accepted) {
                    const trampledSuccessful = {};
                    tramplePath(relation.getPropertyName(), trampledSuccessful, acceptedQuery.getExpansionObject());

                    const addToFinalAccepted = new Query(
                        queriedQuery.getEntitySchema(),
                        and(
                            queriedQuery.getCriteria(),
                            fromDeepBag({ [relation.getPropertyName()]: acceptedQuery.getCriteria() })
                        ),
                        trampledSuccessful
                    );

                    finalAccepted.push(addToFinalAccepted);
                }

                for (const rejectedQuery of rejected) {
                    const trampledRejected = {};
                    tramplePath(relation.getPropertyName(), trampledRejected, rejectedQuery.getExpansionObject());

                    const addToFinalRejected = new Query(
                        queriedQuery.getEntitySchema(),
                        and(
                            queriedQuery.getCriteria(),
                            fromDeepBag({ [relation.getPropertyName()]: rejectedQuery.getCriteria() })
                        ),
                        trampledRejected
                    );

                    finalRejected.push(addToFinalRejected);
                }
            }

            joinEntities(
                // [todo] mutating entities within a QueriedEntities
                queriedEntities.getEntities(),
                result,
                relation.getPropertyName(),
                fromIndex.getPath(),
                toIndex.getPath(),
                isArray
            );

            yield new QueryStreamPacket<T>({
                accepted: finalAccepted,
                rejected: finalRejected,
                payload: [new QueriedEntities(queriedEntities.getQuery(), queriedEntities.getEntities())],
            });
        }

        class DefaultHydrator implements IEntityHydrator {
            async *hydrate<T extends Entity = Entity>(
                entities: QueriedEntities<T>[],
                source: IEntitySource_V2
            ): QueryStream<T> {
                for (const queriedEntities of entities) {
                    const expansionObject = queriedEntities.getQuery().getExpansionObject();
                    const schema = queriedEntities.getQuery().getEntitySchema();
                    const entities = queriedEntities.getEntities();

                    for (const propertyKey in expansionObject) {
                        const expansionValue = expansionObject[propertyKey];

                        if (expansionValue === void 0) {
                            continue;
                        }

                        const relation = schema.findRelation(propertyKey);

                        // if (relation !== void 0 && !isExpanded(entities, relation.getPropertyName())) {
                        if (relation !== void 0) {
                            const accepted: Query<T>[] = [];

                            for await (const packet of expandRelation(
                                queriedEntities,
                                relation,
                                source,
                                expansionValue === true ? void 0 : expansionValue
                            )) {
                                yield packet;
                            }

                            // yield new QueryStreamPacket<T>({
                            //     accepted: [queriedEntities.getQuery()],
                            // });

                            // yield new QueryStreamPacket<T>({
                            //     payload: [new QueriedEntities(queriedEntities.getQuery(), entities)],
                            // });
                        } else if (expansionValue !== true) {
                            // const property = schema.getProperty(propertyKey);
                            // const referencedItems: Entity[] = [];
                            // for (const entity of entities) {
                            //     const reference = walkPath<Entity>(propertyKey, entity);
                            //     if (Array.isArray(reference)) {
                            //         referencedItems.push(...reference);
                            //     } else if (reference) {
                            //         referencedItems.push(reference);
                            //     }
                            // }
                            // const entitySchema = property.getUnboxedEntitySchema();
                            // const task = (async () => {
                            //     const result = await expandEntities(
                            //         entitySchema,
                            //         new Expansion(expansionValue),
                            //         referencedItems,
                            //         source
                            //     );
                            //     return result;
                            // })();
                            // tasks.push(task);
                        }
                    }
                }
            }
        }

        const bundler = new EntitySourceGateway_V2(
            [
                new LoadFooByIdSource(),
                new LoadFooByIsEvenSource(),
                new LoadBarByIdSource(),
                new LoadBazByIdSource(),
                new LoadFooChildByFooIdSource(),
            ],
            [new DefaultHydrator()]
        );
        // const bundler = new BunduruViaRepeaters([new LoadFooByIdSource(), new LoadFooByIsEvenSource()]);

        const stream = bundler.query([
            // new Query(barSchema, matches<Bar>({ id: 7 })),
            // new Query(
            //     fooSchema,
            //     or([matches<Foo>({ id: or(inSet([1, 4, 3]), inRange(7)) })]),
            //     // or([matches<Foo>({ id: or(inSet([1, 4, 3]), inRange(7)) }), matches<Foo>({ isEven: true })]),
            //     { bar: true }
            // ),
            new Query<Foo>(fooSchema, matches<Foo>({ id: inSet([2, 3]) }), {
                id: true,
                name: true,
                bar: { id: true, name: true, baz: true },
                children: { foo: true },
            }),
        ]);

        const packets: QueryStreamPacket[] = [];

        for await (const packet of stream) {
            packets.push(packet);
            console.log(packet.toString());
        }

        const accepted = mergeQueries(...flatMap(packets, packet => packet.getAcceptedQueries()));
        accepted.forEach(q => console.log("🎯 ✔️ " + q));
        const rejected = mergeQueries(...flatMap(packets, packet => packet.getRejectedQueries()));
        rejected.forEach(q => console.log("🎯 ❌ " + q));

        const entities = flatMap(packets, packet => packet.getEntitiesFlat());
        // console.log("raw:", JSON.stringify(entities, void 0, 4));

        const merged = mergeEntities(fooSchema, entities);
        console.log("merged:", JSON.stringify(merged, void 0, 4));
    });

    function assertCriterionShape<T extends ICriterionTemplate>(
        template: T,
        criterion: Criterion
    ): asserts criterion is InstancedCriterionTemplate<T> {
        if (!template.matches(criterion)) {
            throw new Error(`expected criterion ${criterion} to match TODO_INSERT_TEMPLATE_STRING_HERE`);
        }
    }

    it("mutation stuff", () => {
        interface Mutation {
            foo: any;
        }

        interface MutationResult {
            bar: any;
        }

        type MutationStream = Generator<MutationResult, MutationResult, void>;

        interface IEntityStoreV2 {
            mutate(mutation: Mutation): MutationStream;
        }
    });

    it("already obsolete", () => {
        interface DescribedQuery<T> {
            open: Query<T>[];
            accepted: Query<T>[];
        }

        interface QueryStreamPacket<T> {
            open: Query<T>[];
            accepted: Query<T>[];
            payload: { query: Query<T>; entities: T[] }[];
            errors: { error: unknown; query: Query<T> }[];
        }

        type QueryStreamGenerator<T> = Generator<QueryStreamPacket<T>, QueryStreamPacket<T>, void>;

        interface IQueryStreamSource<T extends Entity = Entity> {
            describe(query: Query<T>): Promise<DescribedQuery<T>>;
            fetch(query: Query<T>, cancel?: Promise<unknown>): QueryStreamGenerator<T>;
        }

        class FooQueryStreamSource implements IQueryStreamSource {
            describe(query: Query): Promise<DescribedQuery<Entity>> {
                throw new Error("Method not implemented.");
            }

            *fetch(query: Query, cancel?: Promise<unknown>): QueryStreamGenerator<Entity> {
                throw new Error("Method not implemented.");
            }
        }
    });
});
