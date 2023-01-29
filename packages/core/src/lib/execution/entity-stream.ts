import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { EntityStreamPacket } from "./entity-stream-packet";

export type EntityStream<T extends Entity = Entity> = Observable<EntityStreamPacket<T>>;
