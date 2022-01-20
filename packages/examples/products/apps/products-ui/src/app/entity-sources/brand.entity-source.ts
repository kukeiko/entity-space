import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
    Criterion,
    IEntitySchema,
    IEntitySource,
    InNumberSetCriterion,
    NamedCriteriaTemplate,
    or,
    QueriedEntities,
    Query,
} from "@entity-space/core";
import { Brand } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom, Observable, Subject } from "rxjs";

@Injectable()
export class BrandEntitySource implements IEntitySource {
    constructor(private readonly http: HttpClient) {}

    private queryIssued = new Subject<Query>();

    // [todo] workaround that needs to be resolved at some time
    schema_TMP!: IEntitySchema;

    onQueryIssued(): Observable<Query> {
        return this.queryIssued.asObservable();
    }

    async query(query: Query): Promise<false | QueriedEntities> {
        if (query.entitySchema.getId() !== this.schema_TMP.getId()) {
            return false;
        }

        this.queryIssued.next(query);
        const [filters, effectiveCriterion] = this.mapCriteriaToByIdFilter(query.criteria);

        const responses = await Promise.all(
            filters.map(id => firstValueFrom(this.http.get<Brand>(`api/brands/${id}`)))
        );

        const effectiveQuery: Query = {
            entitySchema: query.entitySchema,
            criteria: effectiveCriterion,
            expansion: {},
        };

        return new QueriedEntities(effectiveQuery, responses);
    }

    private mapCriteriaToByIdFilter(criteria: Criterion): [number[], Criterion] {
        const template = new NamedCriteriaTemplate({
            id: [InNumberSetCriterion],
        });

        const [remapped, open] = criteria.remap([template]);

        if (remapped === false) {
            throw new Error(`failed to remap criterion`);
        }

        const filters: number[] = [];

        for (const criterion of remapped) {
            const bag = criterion.getBag();

            if (bag.id !== void 0) {
                filters.push(...bag.id.getValues());
            }
        }

        return [Array.from(new Set(filters)), or(remapped)];
    }
}
