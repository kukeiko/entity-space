import { StringIndexable } from "../util";
import { Saveables, Query } from "../elements";
import { IEntity, AnyEntityType } from "../metadata";

export interface IService {
    load: (q: Query<any>) => Promise<StringIndexable[]>;
    save?: (saveables: Saveables) => Promise<Map<AnyEntityType, StringIndexable[]>>;
    delete?: (entities: IEntity[]) => Promise<void>;
}
