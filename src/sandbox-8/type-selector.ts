import { Property, MixinPropertyWithMappedValue, DefaultValueOfProperty, PropertyKeysOf, PropertyWithMappedValue } from "./property";
import { Unbox, Primitive } from "./lang";
import { Type, DynamicType, TypeMetadataSymbol, StaticType } from "./type";
import { Expandable } from "./components";

export type PickProperties<T, P = Property> = {
    [K in PropertyKeysOf<T, P>]:
    T[K] extends Property ? PropertyWithMappedValue<T[K], DefaultValueOfProperty<T[K]>>
    : never;
};

export type SelectedValueOfProperty<P extends Property>
    = P["value"] extends Primitive ? P["value"]
    : SelectedType<Unbox<P["value"]>>;

export type SelectedType<T extends StaticType> = DynamicType<T> & {
    [K in PropertyKeysOf<T>]?: PropertyWithMappedValue<T[K], SelectedValueOfProperty<T[K]>>;
};

/**
 * [todo]
 * i added "T extends StaticType", but runtime checks are missing
 */
export class TypeSelector<T extends StaticType, S = {} & DynamicType<T>> {
    constructor(type: T) {
        this._type = type;

        let selectedType: DynamicType = {
            [TypeMetadataSymbol]: DynamicType.Metadata.create(type)
        };

        this._selected = selectedType as any as S;
    }

    private readonly _type: T;
    private readonly _selected: S;

    select<P extends Property>(
        /**
         * [note]
         * by not using "PropertiesOf<T>" we can support "find references" @ IDE,
         */
        // select: (properties: PropertiesOf<T>) => P
        select: (properties: T) => P
    ): TypeSelector<T, S & MixinPropertyWithMappedValue<P, DefaultValueOfProperty<P>>>;

    select<P extends Property & Expandable, E>(
        // select: (properties: PropertiesOf<T, Expandable>) => P,
        select: (properties: T) => P,
        expand: (selector: TypeSelector<Unbox<P["value"]>>) => TypeSelector<Unbox<P["value"]>, E>
        // ): Query<T, Q & WithPropertyWithMappedValue<P, QueriedValueOfProperty<P> & E>>;
    ): TypeSelector<T, S & MixinPropertyWithMappedValue<P, E>>;

    // select<P extends Defaulted | Creatable>(flags: P): TypeSelector<T, S & PickProperties<T, P>>;

    select(...args: any[]): any {
        if (args.length === 1 && args[0] instanceof Function) {
            this._selectProperty(this._fetchProperty(args[0]));
        } else if (args.length === 2 && args[0] instanceof Function && args[1] instanceof Object) {
            let property = this._fetchProperty(args[0]);
            let type = this._getExpandableType(property);
            let expand: (selector: TypeSelector<any>) => TypeSelector<any> = args[1];
            let expandedType = expand(new TypeSelector(type)).build();
            this._selectProperty(property, expandedType);
        } else {
            throw new Error(`arguments didn't match any overload signature`);
        }

        return this;
    }

    private _fetchProperty(selectFromType: (type: T) => Property): Property {
        return selectFromType(this._type);
    }

    private _getExpandableType(property: Property): StaticType {
        if (!Expandable.is(property)) {
            throw new Error(`property '${property.key}' is not expandable`);
        }

        return property.value instanceof Function ? new property.value() : property.value;
    }

    private _selectProperty(property: Property, value?: any): void {
        let copy = { ...property };

        if (value !== void 0) {
            copy.value = value;
        }

        (this._selected as any)[property.key] = copy;
    }

    build(): S {
        return this._selected;
    }
}
