import {
    CriterionShape,
    Entity,
    EntityQuery,
    EntitySchema,
    EntitySelection,
    PackedEntitySelection,
    selectionToString,
} from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { EntityHydrator } from "./hydration/entity-hydrator";
import { EntityMutationType } from "./mutation/entity-mutation";

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
        return `${this.#lines.join("\n")}\n`;
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
        this.#logForQuery(query, builder => {
            builder.addLine("🥚 query spawned:").addLine(`- query: ${query.toString()}`, 1);

            if (source) {
                builder.addLine(`- source: ${source}`, 1);
            }
        });
    }

    hydrationQuerySpawned(query: EntityQuery): void {
        this.#logForQuery(query, builder => {
            builder.addLine("💧 hydration query spawned:").addLine(`- query: ${query}`, 1);
        });
    }

    queryResolved(query: EntityQuery, result?: string): void {
        this.#logForQuery(query, builder => {
            builder.addLine(`🐣 query has been resolved:`).addLine(`- query: ${query}`, 1);

            if (result !== undefined) {
                builder.addLine(`- result: ${result}`, 1);
            }
        });
    }

    queryDispatchedToSource(reshaped: EntityQuery, original: EntityQuery, shape?: CriterionShape): void {
        this.#logForQuery(original, builder => {
            builder.addLine("🔌 query got dispatched to a source:");

            if (original.toString() === reshaped.toString()) {
                builder.addLine(`- query: ${original}`, 1);
            } else {
                builder.addLine(`- original: ${original}`, 1).addLine(`- reshaped: ${reshaped}`, 1);
            }

            builder.addLine(`- source: ${shape ?? "(any)"}`, 1);
        });
    }

    queryDispatchedToHydrator(query: EntityQuery): void {
        this.#logForQuery(query, builder => {
            builder.addLine("🚰 query got dispatched to a hydrator:");
        });
    }

    queryReceivedEntities(query: EntityQuery, entities: readonly Entity[]): void {
        this.#logForQuery(query, builder => {
            builder.addLine("🚚 query received payload:").addLine(`- query: ${query}`, 1);
            this.#addEntityLines(entities, builder, 1);
        });
    }

    filteredInvalidEntities(query: EntityQuery, entities: readonly Entity[]): void {
        this.#logForQuery(query, builder => {
            builder.addLine("🐞 filtered invalid entities:").addLine(`- query: ${query}`, 1);
            this.#addEntityLines(entities, builder, 1);
        });
    }

    queryWasLoadedFromCache(query: EntityQuery): void {
        this.#logForQuery(query, builder => {
            builder.addLine("💾 query was loaded from cache:").addLine(`- query: ${query}`, 1);
        });
    }

    hydratorAcceptedSelection(
        hydrator: EntityHydrator,
        openSelection: EntitySelection,
        acceptedSelection: EntitySelection,
        remainingOpen?: boolean | EntitySelection,
    ): void {
        this.#log(builder => {
            builder.addLine(`✅ hydrator ${hydrator.toString()} accepted selection:`);
            builder.addLine(" - requested:", 1);
            builder.addLine(selectionToString(openSelection), 2);
            builder.addLine(" - accepted:", 1);
            builder.addLine(selectionToString(acceptedSelection), 2);

            if (remainingOpen && typeof remainingOpen !== "boolean") {
                builder.addLine(" - remaining:", 1);
                builder.addLine(selectionToString(remainingOpen), 2);
            }
        });
    }

    selectionGotExpanded(
        from: EntitySelection | PackedEntitySelection,
        to: EntitySelection | PackedEntitySelection,
        added: EntitySelection | PackedEntitySelection,
    ): void {
        this.#log(builder => {
            builder.addLine(`↕️ selection got expanded:`);
            builder.addLine(" - from:", 1);
            builder.addLine(selectionToString(from), 2);
            builder.addLine(" - to:", 1);
            builder.addLine(selectionToString(to), 2);
            builder.addLine(" - added:", 1);
            builder.addLine(selectionToString(added), 2);
        });
    }

    hydrationHasOpenSelection(selection: EntitySelection): void {
        this.#log(builder => {
            builder.addLine(`❌ hydration has open selection:`);
            builder.addLine(selectionToString(selection), 1);
        });
    }

    dispatchedMutation(schema: EntitySchema, type: EntityMutationType, entities: Entity[]): void {
        const icons: Record<EntityMutationType, string> = {
            create: "🆕",
            delete: "❌",
            save: "💾",
            update: "✏️",
        };

        this.#log(builder => {
            builder.addLine(`${icons[type]} ${type} ${schema.getName()} received:`);

            for (const entity of entities) {
                builder.addLine(` - ${JSON.stringify(entity)}`, 1);
            }
        });
    }

    writingDependency(type: EntityMutationType, path: Path, isOutbound: boolean): void {
        this.#log(builder => {
            builder.addLine(`⚡ writing ${isOutbound ? "outbound" : "inbound"} dependency:`);
            builder.addLine(` - type: ${type}`, 1);
            builder.addLine(` - path: ${path.toString()}`, 1);
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

    #log(build: (builder: EntityQueryTraceMessageBuilder) => unknown): void {
        if (!this.#consoleEnabled) {
            return;
        }

        const builder = new EntityQueryTraceMessageBuilder();
        build(builder);
        const message = builder.buildMessage();
        console.log(message);
    }

    #logForQuery(query: EntityQuery, build: (builder: EntityQueryTraceMessageBuilder) => unknown): void {
        if (!this.#consoleEnabled) {
            return;
        }

        if (this.#consoleEnabled && this.#filters.every(filter => filter(query))) {
            this.#log(build);
        }
    }
}
