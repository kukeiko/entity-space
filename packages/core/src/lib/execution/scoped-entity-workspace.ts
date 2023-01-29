import { DeepPartial, readPath, writePath } from "@entity-space/utils";
import { map, Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { IEntitySchema } from "../common/schema/schema.interface";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { fromDeepBag } from "../criteria/criterion/named/from-deep-bag.fn";
import { MatchesBagArgument } from "../criteria/criterion/named/matches.fn";
import { EntitySelection } from "../query/entity-selection";
import { EntityWorkspace } from "./entity-workspace";

export class ScopedEntityWorkspace<T extends Entity = Entity> {
    constructor({ schema, workspace }: { schema: IEntitySchema<T>; workspace: EntityWorkspace }) {
        this.schema = schema;
        this.workspace = workspace;
    }

    private readonly schema: IEntitySchema<T>;
    private readonly workspace: EntityWorkspace;

    oneById(id: number | string | Entity, hydrate?: UnpackedEntitySelection<T>): Observable<T | undefined> {
        let bag: Record<string, any>;
        const keyPaths = this.schema.getKey().getPath();

        if (keyPaths.length > 1) {
            if (typeof id !== "object") {
                throw new Error("composite id expected");
            }

            bag = {};

            for (const path of keyPaths) {
                bag = writePath(path, bag, readPath(path, id));
            }
        } else {
            bag = writePath(keyPaths[0], {}, id);
        }

        const criterion = fromDeepBag(bag);

        return this.workspace
            .query$<T>(this.schema, criterion, EntitySelection.unpack(this.schema, hydrate ?? true))
            .pipe(map(entities => entities[0]));
    }

    all(hydrate?: UnpackedEntitySelection<T>): Observable<T[]> {
        return this.workspace.query$<T>(this.schema, void 0, EntitySelection.unpack(this.schema, hydrate ?? true));
    }

    many(criteria: MatchesBagArgument<T>, hydrate?: PackedEntitySelection<T>): Observable<T[]> {
        return this.workspace.query$<T>(this.schema, criteria, EntitySelection.unpack(this.schema, hydrate ?? true));
    }

    // [todo] not reactive yet
    hydrate(entities: T[], hydrate: PackedEntitySelection<T>): Observable<T[]> {
        return this.workspace.hydrate$(this.schema, entities, EntitySelection.unpack(this.schema, hydrate));
    }

    async add(entities: DeepPartial<T>[]): Promise<void> {
        return await this.workspace.add(this.schema, entities);
    }
}
