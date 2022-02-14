import { ICriterionTemplate, namedTemplate, orTemplate } from "@entity-space/criteria";
import { Observable, Subject } from "rxjs";
import { IEntitySource } from "../entity/entity-source.interface";
import { QueriedEntities } from "../entity/queried-entities";
import { EntitySchema } from "../schema/entity-schema";
import { Query } from "./query";
import { QueryMapper } from "./query-mapper";
import { QueryMapperBuilder } from "./query-mapper-builder";

export class QueryDispatcher<T = Record<string, any>> implements IEntitySource {
    constructor(entitySchema: EntitySchema) {
        this.entitySchema = entitySchema;
    }

    private readonly entitySchema: EntitySchema;
    private readonly mappers: QueryMapper[] = [];

    private queryIssued = new Subject<Query>();

    onQueryIssued(): Observable<Query> {
        return this.queryIssued.asObservable();
    }

    getEntitySchema(): EntitySchema {
        return this.entitySchema;
    }

    addMapping(mapping: (builder: QueryMapperBuilder<T>) => QueryMapperBuilder): this {
        const mapper = mapping(new QueryMapperBuilder()).build();
        this.mappers.push(mapper);

        return this;
    }

    async query(query: Query): Promise<false | QueriedEntities[]> {
        if (query.getEntitySchema().getId() !== this.entitySchema.getId()) {
            return false;
        }

        const criterionTemplatesOfMappers = new Map<QueryMapper, ICriterionTemplate>();
        this.queryIssued.next(query);

        for (const mapper of this.mappers) {
            criterionTemplatesOfMappers.set(
                mapper,
                namedTemplate(mapper.getRequiredFields(), mapper.getOptionalFields())
            );
        }

        const template = orTemplate(Array.from(criterionTemplatesOfMappers.values()));
        const remapped = template.remap(query.getCriteria());

        if (remapped === false) {
            console.log(`failed to remap query criteria`);
            return false;
        }

        const loadEntities: Promise<QueriedEntities>[] = [];

        for (const orCriteria of remapped.getCriteria()) {
            for (const criterion of orCriteria.getItems()) {
                for (const [mapper, template] of criterionTemplatesOfMappers) {
                    if (!template.matches(criterion)) {
                        continue;
                    }

                    const effectiveExpansion = query.getExpansion().intersect(mapper.getSupportedExpansion());
                    const effectiveQuery = new Query(this.entitySchema, criterion, effectiveExpansion.getObject());

                    loadEntities.push(
                        mapper.load(effectiveQuery).then(entities => new QueriedEntities(effectiveQuery, entities))
                    );
                }
            }
        }

        const queriedEntities = await Promise.all(loadEntities);

        return queriedEntities;
    }
}
