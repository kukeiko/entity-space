import { ICriterionTemplate, namedTemplate, orTemplate } from "@entity-space/criteria";
import { Observable, Subject } from "rxjs";
import { IEntitySource } from "../entity/entity-source.interface";
import { QueriedEntities } from "../entity/queried-entities";
import { EntitySchema } from "../schema/entity-schema";
import { EntityApiEndpoint } from "./entity-api-endpoint";
import { EntityApiEndpointBuilder } from "./entity-api-endpoint-builder";
import { Query } from "./query";

export class EntityApi<T = Record<string, any>> implements IEntitySource {
    constructor(entitySchema: EntitySchema) {
        this.entitySchema = entitySchema;
    }

    private readonly entitySchema: EntitySchema;
    private readonly endpoints: EntityApiEndpoint[] = [];

    private queryIssued = new Subject<Query>();

    onQueryIssued(): Observable<Query> {
        return this.queryIssued.asObservable();
    }

    getEntitySchema(): EntitySchema {
        return this.entitySchema;
    }

    addEndpoint(mapping: (builder: EntityApiEndpointBuilder<T>) => EntityApiEndpointBuilder): this {
        const mapper = mapping(new EntityApiEndpointBuilder()).build();
        this.endpoints.push(mapper);

        return this;
    }

    async query(query: Query): Promise<false | QueriedEntities[]> {
        if (query.getEntitySchema().getId() !== this.entitySchema.getId()) {
            return false;
        }

        this.queryIssued.next(query);
        const endpointCriteriaTemplates = new Map<EntityApiEndpoint, ICriterionTemplate>();

        for (const endpoint of this.endpoints) {
            endpointCriteriaTemplates.set(
                endpoint,
                namedTemplate(endpoint.getRequiredFields(), endpoint.getOptionalFields())
            );
        }

        const template = orTemplate(Array.from(endpointCriteriaTemplates.values()));
        const remapped = template.remap(query.getCriteria());

        if (remapped === false) {
            console.log(`failed to remap query criteria`);
            return false;
        }

        const loadEntities: Promise<QueriedEntities>[] = [];

        for (const orCriteria of remapped.getCriteria()) {
            for (const criterion of orCriteria.getItems()) {
                for (const [mapper, template] of endpointCriteriaTemplates) {
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
