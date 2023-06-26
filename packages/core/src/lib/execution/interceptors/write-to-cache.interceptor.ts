import { forkJoin, map, of, switchMap, tap } from "rxjs";
import { Entity } from "../../common/entity.type";
import { IEntityDatabase } from "../../entity/entity-database.interface";
import { EntityStream } from "../entity-stream";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export class WriteToCacheInterceptor implements IEntityStreamInterceptor {
    constructor(private readonly database: IEntityDatabase) {}

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return stream.pipe(
            switchMap(packet => {
                return forkJoin({
                    packet: of(packet),
                    upserts: forkJoin(packet.getPayload().map(payload => this.database.upsert$(payload))),
                });
            }),
            map(({ packet }) => packet)
        );
    }
}
