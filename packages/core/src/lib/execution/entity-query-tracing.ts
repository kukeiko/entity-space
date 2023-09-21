import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityQuery } from "../query/entity-query.interface";
import { ICriterionShape } from "../criteria/criterion-shape.interface";

type EntityQueryTracingFilter = (query: IEntityQuery) => boolean;

export class EntityQueryTracing {
    private consoleEnabled = false;
    private filters: EntityQueryTracingFilter[] = [];

    private print(query: IEntityQuery, ...message: unknown[]): void {
        if (this.filters.every(filter => filter(query))) {
            console.log(...message);
        }
    }

    enableConsole(flag = true): void {
        this.consoleEnabled = flag;
    }

    addFilter(filter: EntityQueryTracingFilter): this {
        this.filters.push(filter);
        return this;
    }

    querySpawned(query: IEntityQuery, source?: string): void {
        if (!this.consoleEnabled) {
            return;
        }

        let message = `🥚 query spawned: ${query.toString()}`;

        if (source) {
            message = `${message} (source: ${source})`;
        }

        this.print(query, message);
    }

    hydrationQuerySpawned(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(query, `🥚 💧 hydration query spawned: ${query.toString()}`);
    }

    queryStartedExecution(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(query, "💎 query started execution:", query.toString());
    }

    queryResolved(query: IEntityQuery, result?: string): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(
            query,
            `🐣 query has been resolved: ${query.toString()}${result !== void 0 ? `, result: ${result}` : ""}`
        );
    }

    queryGotSubtracted(
        query: IEntityQuery,
        by: IEntityQuery[],
        result: IEntityQuery[],
        options?: { byLabel?: string }
    ): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(
            query,
            "🎈 query got subtracted:",
            query.toString(),
            (options?.byLabel ?? ", by") + ":",
            by.map(query => query.toString()),
            result.map(query => query.toString())
        );
    }

    queryGotFullySubtracted(query: IEntityQuery, by: IEntityQuery[], options?: { byLabel?: string }): void {
        if (!this.consoleEnabled) {
            return;
        }

        return;
        this.print(
            query,
            `🎀 query got fully subtracted: ${query.toString()}, ${options?.byLabel ?? "by"}: ${by.map(query =>
                query.toString()
            )}`
        );
    }

    queryDispatchedToEndpoint(query: IEntityQuery, shape: ICriterionShape): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(
            query,
            `🔌 query ${query.toString()} got dispatched to an endpoint accepting criteria ${shape.toString()}`
        );
    }

    endpointDeliveredPacket(query: IEntityQuery, shape: ICriterionShape, packet: EntityStreamPacket): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(
            query,
            `🔌 🚚 query ${query.toString()} got a packet via endpoint ${shape.toString()}: ${packet.toString()}`
        );
    }

    queryReceivedPacket(query: IEntityQuery, packet: EntityStreamPacket): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(query, `🚚 query ${query.toString()} received packet ${packet.toString()}`);
    }

    queryGotRejectedByAllSources(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        this.print(query, `❌ query got rejected by all sources: ${query.toString()}`);
    }

    reactiveQueryEmitted(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        return;

        this.print(query, `🔥 reactive query ${query.toString()} caused an emit`);
    }

    reactiveQueryDisposed(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        return;

        this.print(query, `🧹 reactive query ${query.toString()} got disposed`);
    }

    fromCache(query: IEntityQuery): void {
        this.print(query, "💾 from cache", query.toString());
    }

    streamDidNotReportAnyRejections(queries: IEntityQuery[], interceptorName: string): void {
        queries.forEach(query => {
            this.print(
                query,
                `🐞 original stream ${interceptorName} didn't report any meaningful rejections`,
                query.toString()
            );
        });
    }

    streamDidNotReportSomeRejections(queries: IEntityQuery[], expected: IEntityQuery[], interceptorName: string): void {
        queries.forEach(query => {
            this.print(
                query,
                `🐞 original stream ${interceptorName} didn't report some rejections`,
                query.toString(),
                expected.join(", ")
            );
        });
    }
}
