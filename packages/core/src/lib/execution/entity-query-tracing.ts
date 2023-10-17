import { ICriterionShape } from "../criteria/criterion-shape.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityStreamPacket } from "./entity-stream-packet";

const TAB_WIDTH = 4;
const MAX_FULLY_PRINTED_ENTITIES = 10;

type EntityQueryTracingFilter = (query: IEntityQuery) => boolean;

class EntityQueryTraceMessageBuilder {
    private lines: string[] = [];

    addLine(message: string, indent = 0): this {
        this.lines.push(" ".repeat(indent * TAB_WIDTH) + message);
        return this;
    }

    buildMessage(): string {
        return this.lines.join("\n");
    }
}

export class EntityQueryTracing {
    private consoleEnabled = false;
    private filters: EntityQueryTracingFilter[] = [];

    private log(query: IEntityQuery, build: (builder: EntityQueryTraceMessageBuilder) => unknown): void {
        if (!this.consoleEnabled) {
            return;
        }

        if (this.filters.every(filter => filter(query))) {
            const builder = new EntityQueryTraceMessageBuilder();
            build(builder);
            const message = builder.buildMessage();
            console.log(message);
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
        this.log(query, builder => {
            builder.addLine("🥚 query spawned:").addLine(`- query: ${query.toString()}`, 1);

            if (source) {
                builder.addLine(`- source: ${source}`, 1);
            }
        });
    }

    hydrationQuerySpawned(query: IEntityQuery): void {
        this.log(query, builder => {
            builder.addLine("🥚 💧 hydration query spawned:").addLine(`- query: ${query}`, 1);
        });
    }

    queryResolved(query: IEntityQuery, result?: string): void {
        this.log(query, builder => {
            builder.addLine(`🐣 query has been resolved:`).addLine(`- query: ${query}`, 1);

            if (result !== undefined) {
                builder.addLine(`- result: ${result}`, 1);
            }
        });
    }

    queryDispatchedToEndpoint(original: IEntityQuery[], reshaped: IEntityQuery, shape: ICriterionShape): void {
        original.forEach(original => {
            this.log(original, builder =>
                builder
                    .addLine("🔌 query got dispatched to an endpoint:")
                    .addLine(`- original: ${original}`, 1)
                    .addLine(`- reshaped: ${reshaped}`, 1)
                    .addLine(`- endpoint: ${shape}`, 1)
            );
        });
    }

    endpointDeliveredPacket(query: IEntityQuery, shape: ICriterionShape, packet: EntityStreamPacket): void {
        this.log(query, builder => {
            builder
                .addLine(`🔌 🚚 query got a packet from endpoint:`)
                .addLine(`- query: ${query}`, 1)
                .addLine(`- endpoint: ${shape}`, 1)
                .addLine(`- packet:`, 1);

            this.addPacketLines(packet, builder, 2);
        });
    }

    queryReceivedPacket(query: IEntityQuery, packet: EntityStreamPacket): void {
        this.log(query, builder => {
            builder.addLine("🚚 query received a packet:").addLine(`- query: ${query}`, 1).addLine("- packet:", 1);
            this.addPacketLines(packet, builder, 2);
        });
    }

    queryWasLoadedFromCache(query: IEntityQuery): void {
        this.log(query, builder => {
            builder.addLine("💾 query was loaded from cache:").addLine(`- query: ${query}`, 1);
        });
    }

    streamDidNotReportAnyRejections(query: IEntityQuery, interceptorName: string): void {
        this.log(query, builder => {
            builder
                .addLine("🐞 original stream didn't report any meaningful rejections:")
                .addLine(`- interceptor: ${interceptorName}`, 1)
                .addLine(`- query: ${query}`);
        });
    }

    streamDidNotReportSomeRejections(query: IEntityQuery, expected: IEntityQuery[], interceptorName: string): void {
        this.log(query, builder => {
            builder
                .addLine("🐞 original stream didn't report some rejections")
                .addLine(`- interceptor: ${interceptorName}`, 1)
                .addLine(`- query: ${query}`, 1)
                .addLine(`- expected:`, 1);

            expected.forEach(expected => builder.addLine(`- ${expected}`, 2));
        });
    }

    private addPacketLines(packet: EntityStreamPacket, builder: EntityQueryTraceMessageBuilder, indent = 0): void {
        if (packet.isEmpty()) {
            builder.addLine("- (empty)", indent);
            return;
        }

        const accepted = packet.getAcceptedQueries();

        if (accepted.length) {
            builder.addLine(`- ✔️ accepted:`, indent);
            accepted.forEach(query => builder.addLine(`- ${query}`, indent + 1));
        }

        const delivered = packet.getDeliveredQueries();

        if (delivered.length) {
            builder.addLine(`- 🚚 delivered:`, indent);
            delivered.forEach(query => builder.addLine(`- ${query}`, indent + 1));
        }

        const rejected = packet.getRejectedQueries();

        if (rejected.length) {
            builder.addLine(`- ❌ accepted:`, indent);
            rejected.forEach(query => builder.addLine(`- ${query}`, indent + 1));
        }

        const entities = packet.getEntitiesFlat();

        if (entities.length) {
            builder.addLine(`- 🎁 payload: ${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`, indent);
            entities
                .slice(0, MAX_FULLY_PRINTED_ENTITIES)
                .forEach(entity => builder.addLine(`- ${JSON.stringify(entity)}`, indent + 1));

            if (entities.length > MAX_FULLY_PRINTED_ENTITIES) {
                builder.addLine(`- ... (and ${entities.length - MAX_FULLY_PRINTED_ENTITIES} more)`, indent + 1);
            }
        }
    }
}
