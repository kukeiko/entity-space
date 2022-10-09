import { IEntitySource, InMemoryEntityDatabase, mergeQueries, Query, QueryStreamPacket } from "@entity-space/core";
import { flatMap, flatten } from "lodash";
import { firstValueFrom, scan, takeLast, tap } from "rxjs";

export type QueryTestHelperOptions =
    | { logTracing?: boolean; logEach?: boolean; logFinal?: boolean; logEntities?: boolean }
    | true;

export async function queryTestHelper<T>(
    queries: Query[] | Query,
    source: IEntitySource,
    options?: QueryTestHelperOptions
): Promise<[T[], QueryStreamPacket]> {
    if (!Array.isArray(queries)) {
        queries = [queries];
    }

    options = options ?? {};

    if (options === true) {
        options = { logEach: true, logEntities: true, logFinal: true };
    }

    const { logEach, logEntities, logFinal } = options;

    const cache = new InMemoryEntityDatabase();
    const stream = source.query$(queries, cache).pipe(
        tap(packet => {
            if (logEach) {
                console.log(packet.toString());
            }
        }),
        scan(QueryStreamPacket.concat),
        takeLast(1)
    );

    const mergedPacket = await firstValueFrom(stream);

    if (logFinal) {
        const accepted = mergeQueries(...mergedPacket.getAcceptedQueries()).map(q => q.toString());
        const rejected = mergeQueries(...mergedPacket.getRejectedQueries()).map(q => q.toString());

        console.log("🎯 ✔️ ", JSON.stringify(accepted, void 0, 4));
        console.log("🎯 ❌ ", JSON.stringify(rejected, void 0, 4));
    }

    const entities = flatMap(flatten(queries.map(query => cache.querySync(query))), entities => entities.getEntities());

    if (logEntities) {
        console.log("🎯 📦 ", JSON.stringify(entities));
    }

    return [entities as T[], mergedPacket];
}
