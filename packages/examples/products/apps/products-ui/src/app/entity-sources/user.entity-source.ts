import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Expansion, IEntitySchema, IEntitySource, QueriedEntities, Query, reduceExpansion } from "@entity-space/core";
import { Criterion, inSetTemplate, matchesTemplate, or } from "@entity-space/criteria";
import { User } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom, Observable, Subject } from "rxjs";

@Injectable()
export class UserEntitySource implements IEntitySource {
    constructor(private readonly http: HttpClient) {}

    private queryIssued = new Subject<Query>();

    // [todo] workaround that needs to be resolved at some point
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
        const supportedExpansion: Expansion<User> = {};
        const missingExpansion = reduceExpansion(query.expansion, supportedExpansion);
        const effectiveExpansion =
            (missingExpansion === false ? {} : reduceExpansion(query.expansion, missingExpansion)) ||
            supportedExpansion;

        console.log("[missing-expansion]", missingExpansion || query.expansion);
        console.log("[effective-expansion]", effectiveExpansion);

        const responses = await Promise.all(filters.map(id => firstValueFrom(this.http.get<User>(`api/users/${id}`))));

        const effectiveQuery: Query = {
            entitySchema: query.entitySchema,
            criteria: effectiveCriterion,
            expansion: {},
        };

        return new QueriedEntities(effectiveQuery, responses);
    }

    private mapCriteriaToByIdFilter(criteria: Criterion): [number[], Criterion] {
        const template = matchesTemplate({
            id: [inSetTemplate([Number])],
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
