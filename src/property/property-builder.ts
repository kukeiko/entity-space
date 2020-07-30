import { Property } from "./property";
import { Context } from "./context";
import { Attribute } from "./attribute";

export class PropertyBuilder<K extends string, V extends Property.Value, P extends Property<K, V> = Property<K, V>> {
    constructor(key: K, value: V) {
        const property: Property<K, V> = {
            key,
            value,
        };

        this._property = property as any;
    }

    readonly _property: P;

    filterable(): PropertyBuilder<K, V, P & Attribute.IsFilterable> {
        Attribute.set(this._property, "filterable", true);
        return this as any;
    }

    indexable(): PropertyBuilder<K, V, P & Attribute.IsIndexable> {
        Attribute.set(this._property, "indexable", true);
        return this as any;
    }

    iterable(args?: Attribute.Iterable.Value): PropertyBuilder<K, V, P & Attribute.IsIterable> {
        Attribute.set(this._property, "iterable", args || { sorted: false });
        return this as any;
    }

    unique(): PropertyBuilder<K, V, P & Attribute.IsUnique> {
        Attribute.set(this._property, "unique", true);
        return this as any;
    }

    creatable<CTXOK extends (keyof Context.Options)[] = never[]>(
        optionKeys?: CTXOK
    ): PropertyBuilder<K, V, P & Context.IsCreatable<Context.IncludesOptionsKey<CTXOK, "nullable">, Context.IncludesOptionsKey<CTXOK, "optional">>> {
        Context.set(this._property, "creatable", optionKeys);
        return this as any;
    }

    loadable<CTXOK extends (keyof Context.Options)[] = never[]>(
        optionKeys?: CTXOK
    ): PropertyBuilder<K, V, P & Context.IsLoadable<Context.IncludesOptionsKey<CTXOK, "nullable">, Context.IncludesOptionsKey<CTXOK, "optional">>> {
        Context.set(this._property, "loadable", optionKeys);
        return this as any;
    }

    patchable<CTXOK extends (keyof Context.Options)[] = never[]>(
        optionKeys?: CTXOK
    ): PropertyBuilder<K, V, P & Context.IsPatchable<Context.IncludesOptionsKey<CTXOK, "nullable">, Context.IncludesOptionsKey<CTXOK, "optional">>> {
        Context.set(this._property, "patchable", optionKeys);
        return this as any;
    }

    saveable<CTXOK extends (keyof Context.Options)[] = never[]>(
        optionKeys?: CTXOK
    ): PropertyBuilder<
        K,
        V,
        P &
            Context.IsCreatable<Context.IncludesOptionsKey<CTXOK, "nullable">, Context.IncludesOptionsKey<CTXOK, "optional">> &
            Context.IsPatchable<Context.IncludesOptionsKey<CTXOK, "nullable">, Context.IncludesOptionsKey<CTXOK, "optional">>
    > {
        Context.set(this._property, "patchable", optionKeys);
        return this as any;
    }

    /**
     * [todo] wip
     * [todo] we could instead have an "identifies" method that is used on the id property,
     * so basically switch 'em around.
     */
    identifiedBy(property: Property): PropertyBuilder<K, V, P & { id: Property }> {
        return this as any;
    }

    custom<X extends string, Y>(key: X, value: Y): PropertyBuilder<K, V, P & Record<X, Y>> {
        (this._property as any)[key] = value;
        return this as any;
    }

    build(): P {
        return this._property;
    }
}
