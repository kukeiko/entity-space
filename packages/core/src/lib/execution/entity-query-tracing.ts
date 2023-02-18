import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityQuery } from "../query/entity-query.interface";
import { ICriterionShape } from "../criteria/criterion-shape.interface";

export class EntityQueryTracing {
    private consoleEnabled = false;

    enableConsole(flag = true): void {
        this.consoleEnabled = flag;
    }

    querySpawned(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🥚 query spawned: ${query.toString()}`);
    }

    queryStartedExecution(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log("💎 query started execution:", query.toString());
    }

    queryResolved(query: IEntityQuery, result?: string): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🐣 query has been resolved: ${query.toString()}${result !== void 0 ? `, result: ${result}` : ""}`);
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

        console.log(
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

        console.log(
            `🎀 query got fully subtracted: ${query.toString()}, ${options?.byLabel ?? "by"}: ${by.map(query =>
                query.toString()
            )}`
        );
    }

    queryDispatchedToEndpoint(query: IEntityQuery, template: ICriterionShape): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(
            `🔌 query ${query.toString()} got dispatched to an endpoint accepting criteria ${template.toString()}`
        );
    }

    endpointDeliveredPacket(query: IEntityQuery, template: ICriterionShape, packet: EntityStreamPacket): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(
            `🔌 📦 query ${query.toString()} got a packet via endpoint ${template.toString()}: ${packet.toString()}`
        );
    }

    queryReceivedPacket(query: IEntityQuery, packet: EntityStreamPacket): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`📦 query ${query.toString()} received packet ${packet.toString()}`);
    }

    queryGotRejectedByAllSources(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`❌ query got rejected by all sources: ${query.toString()}`);
    }

    reactiveQueryEmitted(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🔥 reactive query ${query.toString()} caused an emit`);
    }

    reactiveQueryDisposed(query: IEntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🧹 reactive query ${query.toString()} got disposed`);
    }
}
