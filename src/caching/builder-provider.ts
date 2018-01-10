import { TypeOf } from "../util";
import { EntityType } from "../metadata";
import { getBuilderClass, Builder } from "./builder";

export type ResolveBuilder = (type: TypeOf<Builder>) => Builder;

export class BuilderProvider {
    private _builders = new Map<EntityType<any>, Builder>();
    private _resolve: ResolveBuilder = null;

    constructor(resolve: ResolveBuilder) {
        this._resolve = resolve;
    }

    get<T>(entityClass: EntityType<T>): Builder | null {
        let builder = this._builders.get(entityClass);

        if (!builder) {
            let builderClass = getBuilderClass(entityClass);

            if (!builderClass) {
                throw `no builder for entity class ${entityClass.name} found`;
            }

            builder = this._resolve(builderClass);
            this._builders.set(entityClass, builder);
        }

        return builder;
    }
}
