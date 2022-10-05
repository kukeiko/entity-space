import { ICriterionTemplate } from "@entity-space/criteria";
import { QueryStreamPacket } from "../execution/query-stream-packet";
import { Query } from "../query/query";

export class EntityQueryTracing {
    querySpawned(query: Query): void {
        console.log(`🥚 query spawned: ${query.toString()}`);
    }

    queryStartedExecution(query: Query): void {
        console.log("💎 query started execution:", query.toString());
    }

    queryResolved(query: Query, result?: string): void {
        console.log(`🐣 query has been resolved: ${query.toString()}${result !== void 0 ? `, result: ${result}` : ""}`);
    }

    queryGotSubtracted(query: Query, by: Query[], result: Query[], options?: { byLabel?: string }): void {
        console.log(
            "🎈 query got subtracted:",
            query.toString(),
            (options?.byLabel ?? ", by") + ":",
            by.map(query => query.toString()),
            result.map(query => query.toString())
        );
    }

    queryGotFullySubtracted(query: Query, by: Query[], options?: { byLabel?: string }): void {
        console.log(
            `🎀 query got fully subtracted: ${query.toString()}, ${options?.byLabel ?? "by"}: ${by.map(query =>
                query.toString()
            )}`
        );
    }

    queryDispatchedToEndpoint(query: Query, template: ICriterionTemplate): void {
        console.log(
            `🔌 query ${query.toString()} got dispatched to an endpoint acepting criteria ${template.toString()}`
        );
    }

    endpointDeliveredPacket(query: Query, template: ICriterionTemplate, packet: QueryStreamPacket): void {
        console.log(
            `🔌 📦 query ${query.toString()} got a packet via endpoint ${template.toString()}: ${packet.toString()}`
        );
    }

    queryReceivedPacket(query: Query, packet: QueryStreamPacket): void {
        console.log(`📦 query ${query.toString()} received packet ${packet.toString()}`);
    }

    queryGotRejectedByAllSources(query: Query): void {
        console.log(`❌ query got rejected by all sources: ${query.toString()}`);
    }

    reactiveQueryEmitted(query: Query): void {
        console.log(`🔥 reactive query ${query.toString()} caused an emit`);
    }

    reactiveQueryDisposed(query: Query): void {
        console.log(`🧹 reactive query ${query.toString()} got disposed`);
    }
}
