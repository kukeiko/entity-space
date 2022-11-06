import { ICriterionShape } from "@entity-space/criteria";
import { EntityStreamPacket } from "./entity-stream-packet";
import { EntityQuery } from "../query/entity-query";

export class EntityQueryTracing {
    private consoleEnabled = false;

    enableConsole(): void {
        this.consoleEnabled = true;
    }

    querySpawned(query: EntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🥚 query spawned: ${query.toString()}`);
    }

    queryStartedExecution(query: EntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log("💎 query started execution:", query.toString());
    }

    queryResolved(query: EntityQuery, result?: string): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🐣 query has been resolved: ${query.toString()}${result !== void 0 ? `, result: ${result}` : ""}`);
    }

    queryGotSubtracted(query: EntityQuery, by: EntityQuery[], result: EntityQuery[], options?: { byLabel?: string }): void {
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

    queryGotFullySubtracted(query: EntityQuery, by: EntityQuery[], options?: { byLabel?: string }): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(
            `🎀 query got fully subtracted: ${query.toString()}, ${options?.byLabel ?? "by"}: ${by.map(query =>
                query.toString()
            )}`
        );
    }

    queryDispatchedToEndpoint(query: EntityQuery, template: ICriterionShape): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(
            `🔌 query ${query.toString()} got dispatched to an endpoint accepting criteria ${template.toString()}`
        );
    }

    endpointDeliveredPacket(query: EntityQuery, template: ICriterionShape, packet: EntityStreamPacket): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(
            `🔌 📦 query ${query.toString()} got a packet via endpoint ${template.toString()}: ${packet.toString()}`
        );
    }

    queryReceivedPacket(query: EntityQuery, packet: EntityStreamPacket): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`📦 query ${query.toString()} received packet ${packet.toString()}`);
    }

    queryGotRejectedByAllSources(query: EntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`❌ query got rejected by all sources: ${query.toString()}`);
    }

    reactiveQueryEmitted(query: EntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🔥 reactive query ${query.toString()} caused an emit`);
    }

    reactiveQueryDisposed(query: EntityQuery): void {
        if (!this.consoleEnabled) {
            return;
        }

        console.log(`🧹 reactive query ${query.toString()} got disposed`);
    }
}
