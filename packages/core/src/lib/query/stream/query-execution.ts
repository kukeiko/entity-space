import { flatMap } from "lodash";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Query } from "../query";
import { reduceQueries_v2 } from "../reduce-queries.fn";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStreamPacket } from "./query-stream-packet";

export class QueryExecution {
    constructor({
        sources,
        targets,
        database,
    }: {
        sources: IEntitySource_V2[];
        targets: Query[];
        database: InMemoryEntityDatabase;
    }) {
        this.targets = targets.slice();
        this.openSources = sources.slice();
        this.database = database;

        for (const source of sources) {
            this.mergedPacketPerSource.set(source, new QueryStreamPacket());
        }
    }

    private readonly targets: Query[];
    private readonly openSources: IEntitySource_V2[];
    private readonly mergedPacketPerSource = new Map<IEntitySource_V2, QueryStreamPacket>();
    private readonly database: InMemoryEntityDatabase;

    getDatabase(): InMemoryEntityDatabase {
        return this.database;
    }

    popSource(): IEntitySource_V2 | undefined {
        return this.openSources.pop();
    }

    mergePacket(packet: QueryStreamPacket, source: IEntitySource_V2): void {
        this.mergedPacketPerSource.set(source, this.getMergedPacketOfSource(source).merge(packet));
    }

    getMergedPacket(source: IEntitySource_V2): QueryStreamPacket {
        const packet = this.mergedPacketPerSource.get(source);

        if (!packet) {
            throw new Error(`source does not have any merged packet`);
        }

        return packet;
    }

    isSourceFullyPlanned(source: IEntitySource_V2): boolean {
        const packet = this.getMergedPacketOfSource(source);
        const reduced = reduceQueries_v2(this.targets, [
            ...packet.getAcceptedQueries(),
            ...packet.getRejectedQueries(),
        ]);

        return reduced && !reduced.length;
    }

    getOpenTargets(): Query[] {
        const acceptedFromSources = flatMap([...this.mergedPacketPerSource.values()], packet =>
            packet.getAcceptedQueries()
        );

        return reduceQueries_v2(this.targets, acceptedFromSources) || this.targets;
    }

    getTargets(): Query[] {
        return this.targets.slice();
    }

    getAccepted(): Query[] {
        return flatMap(this.getPackets().map(packet => packet.getAcceptedQueries()));
    }

    getRejected(): Query[] {
        return flatMap(this.getPackets().map(packet => packet.getRejectedQueries()));
    }

    getPackets(): QueryStreamPacket[] {
        return Array.from(this.mergedPacketPerSource.values());
    }

    private getMergedPacketOfSource(source: IEntitySource_V2): QueryStreamPacket {
        return this.mergedPacketPerSource.get(source) || new QueryStreamPacket();
    }
}
