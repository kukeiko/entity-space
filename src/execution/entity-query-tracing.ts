import { CriterionShape, Entity, EntityQuery } from "@entity-space/elements";

const TAB_WIDTH = 4;
const MAX_FULLY_PRINTED_ENTITIES = 10;

type EntityQueryTracingFilter = (query: EntityQuery) => boolean;

class EntityQueryTraceMessageBuilder {
    #lines: string[] = [];

    addLine(message: string, indent = 0): this {
        this.#lines.push(" ".repeat(indent * TAB_WIDTH) + message);
        return this;
    }

    buildMessage(): string {
        return this.#lines.join("\n");
    }
}

export class EntityQueryTracing {
    #consoleEnabled = false;
    #filters: EntityQueryTracingFilter[] = [];

    enableConsole(flag = true): this {
        this.#consoleEnabled = flag;
        return this;
    }

    addFilter(filter: EntityQueryTracingFilter): this {
        this.#filters.push(filter);
        return this;
    }

    querySpawned(query: EntityQuery, source?: string): void {
        this.#log(query, builder => {
            builder.addLine("🥚 query spawned:").addLine(`- query: ${query.toString()}`, 1);

            if (source) {
                builder.addLine(`- source: ${source}`, 1);
            }
        });
    }

    hydrationQuerySpawned(query: EntityQuery): void {
        this.#log(query, builder => {
            builder.addLine("🥚 💧 hydration query spawned:").addLine(`- query: ${query}`, 1);
        });
    }

    queryResolved(query: EntityQuery, result?: string): void {
        this.#log(query, builder => {
            builder.addLine(`🐣 query has been resolved:`).addLine(`- query: ${query}`, 1);

            if (result !== undefined) {
                builder.addLine(`- result: ${result}`, 1);
            }
        });
    }

    queryDispatchedToSource(reshaped: EntityQuery, original: EntityQuery, shape?: CriterionShape): void {
        this.#log(original, builder => {
            builder.addLine("🔌 query got dispatched to a source:");

            if (original.toString() === reshaped.toString()) {
                builder.addLine(`- query: ${original}`, 1);
            } else {
                builder.addLine(`- original: ${original}`, 1).addLine(`- reshaped: ${reshaped}`, 1);
            }

            builder.addLine(`- source: ${shape ?? "(any)"}`, 1);
        });
    }

    queryReceivedEntities(query: EntityQuery, entities: readonly Entity[]): void {
        this.#log(query, builder => {
            builder.addLine("🚚 query received payload:").addLine(`- query: ${query}`, 1);
            this.#addEntityLines(entities, builder, 1);
        });
    }

    queryWasLoadedFromCache(query: EntityQuery): void {
        this.#log(query, builder => {
            builder.addLine("💾 query was loaded from cache:").addLine(`- query: ${query}`, 1);
        });
    }

    #addEntityLines(entities: readonly Entity[], builder: EntityQueryTraceMessageBuilder, indent = 0): void {
        if (!entities.length) {
            builder.addLine("- (empty)", indent);
            return;
        }

        if (entities.length) {
            builder.addLine(`- payload: ${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`, indent);
            entities
                .slice(0, MAX_FULLY_PRINTED_ENTITIES)
                .forEach(entity => builder.addLine(`- ${JSON.stringify(entity)}`, indent + 1));

            if (entities.length > MAX_FULLY_PRINTED_ENTITIES) {
                builder.addLine(`- ... (and ${entities.length - MAX_FULLY_PRINTED_ENTITIES} more)`, indent + 1);
            }
        }
    }

    #log(query: EntityQuery, build: (builder: EntityQueryTraceMessageBuilder) => unknown): void {
        if (!this.#consoleEnabled) {
            return;
        }

        if (this.#filters.every(filter => filter(query))) {
            const builder = new EntityQueryTraceMessageBuilder();
            build(builder);
            const message = builder.buildMessage();
            console.log(message);
        }
    }
}
