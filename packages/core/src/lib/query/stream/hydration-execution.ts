import { flatMap } from "lodash";
import { EntityHydrationQuery, EntitySet } from "../../entity";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Query } from "../query";
import { reduceQueries_v2 } from "../reduce-queries.fn";
import { IEntityHydrator } from "./i-entity-hydrator";
import { QueryStreamPacket } from "./query-stream-packet";

export class HydrationExecution {
    constructor({
        hydrators,
        targets,
        database,
    }: {
        hydrators: IEntityHydrator[];
        targets: EntityHydrationQuery[];
        database: InMemoryEntityDatabase;
    }) {
        this.openHydrators = hydrators.slice();
        this.targets = targets.slice();
        this.database = database;

        for (const hydrator of hydrators) {
            this.mergedPacketPerHydrator.set(hydrator, new QueryStreamPacket());
        }
    }

    private readonly openHydrators: IEntityHydrator[];
    private readonly targets: EntityHydrationQuery[];
    private readonly mergedPacketPerHydrator = new Map<IEntityHydrator, QueryStreamPacket>();
    private readonly database: InMemoryEntityDatabase;

    getDatabase(): InMemoryEntityDatabase {
        return this.database;
    }

    popHydrator(): IEntityHydrator | undefined {
        return this.openHydrators.pop();
    }

    mergePacket(packet: QueryStreamPacket, hydrator: IEntityHydrator): void {
        this.mergedPacketPerHydrator.set(hydrator, this.getMergedPacket(hydrator).merge(packet));
    }

    getMergedPacket(hydrator: IEntityHydrator): QueryStreamPacket {
        const packet = this.mergedPacketPerHydrator.get(hydrator);

        if (!packet) {
            throw new Error(`hydrator does not have any merged packet`);
        }

        return packet;
    }

    isHydratorFullyPlanned(hydrator: IEntityHydrator): boolean {
        const packet = this.getMergedPacket(hydrator);
        const reduced = reduceQueries_v2(
            this.getOpenTargets().map(target => target.getQuery()),
            [...packet.getAcceptedQueries(), ...packet.getRejectedQueries()]
        );

        return reduced && !reduced.length;
    }

    getOpenTargets(): EntityHydrationQuery[] {
        const acceptedFromHydrators = flatMap([...this.mergedPacketPerHydrator.values()], packet =>
            packet.getAcceptedQueries()
        );

        // [todo] meh
        const openTargets = flatMap(
            this.targets.map(target => {
                const targetQuery = target.getQuery();
                // new Query(
                //     target.getEntitySet().getQuery().getEntitySchema(),
                //     target.getEntitySet().getQuery().getCriteria(),
                //     target.getQuery().getExpansion()
                // );

                const reduced = reduceQueries_v2([targetQuery], acceptedFromHydrators) || [targetQuery];

                return reduced.map(reducedQuery => {
                    return new EntityHydrationQuery({
                        entitySet: new EntitySet({
                            query: new Query(
                                target.getQuery().getEntitySchema(),
                                reducedQuery.getCriteria(),
                                target.getQuery().getExpansion()
                            ),
                            entities: reducedQuery.getCriteria().filter(target.getEntitySet().getEntities()),
                        }),
                        query: reducedQuery,
                    });
                });
            })
        );

        return openTargets;
    }
}
