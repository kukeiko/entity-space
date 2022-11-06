import { Entity } from "@entity-space/common";
import { Observable } from "rxjs";
import { EntityStreamPacket } from "./entity-stream-packet";

export type EntityStream<T extends Entity = Entity> = Observable<EntityStreamPacket<T>>;
