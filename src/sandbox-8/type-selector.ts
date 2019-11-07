import { Property, MixinPropertyWithMappedValue, DefaultValueOfProperty, PropertyKeysOf, PropertyWithMappedValue, propertiesOf } from "./property";
import { Unbox } from "./lang";
import { DynamicType, TypeMetadataSymbol, StaticType } from "./type";
import { Flag, Flagged, isFlagged } from "./flag";

/**
 * This type is kind of a replica of "PropertiesOf" @ property.ts, but instead with properties where the value is mapped to a new type of value.
 * I'd like just use "PropertiesOf" instead where I can somehow specify the mapping, but I don't know how to do that right now.
 */
export type PickPropertiesWithDefaultValue<T, P = Property> = {
    [K in PropertyKeysOf<T, P>]:
    T[K] extends Property ? PropertyWithMappedValue<T[K], DefaultValueOfProperty<T[K]>>
    : never;
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

    select<F extends Flag[]>(flags: F)
        : TypeSelector<T, S & PickPropertiesWithDefaultValue<T, Flagged<F[number]>>
        >;

    select<P extends Property>(
        /**
         * [note]
         * by not using "PropertiesOf<T>" we can support "find references" @ IDE
         */
        // select: (properties: PropertiesOf<T>) => P
        select: (properties: T) => P
    ): TypeSelector<T, S & MixinPropertyWithMappedValue<P, DefaultValueOfProperty<P>>>;

    select<P extends Property & Flagged<"expandable">, E>(
        // select: (properties: PropertiesOf<T, Expandable>) => P,
        select: (properties: T) => P,
        expand: (selector: TypeSelector<Unbox<P["value"]>>) => TypeSelector<Unbox<P["value"]>, E>
        // ): Query<T, Q & WithPropertyWithMappedValue<P, QueriedValueOfProperty<P> & E>>;
    ): TypeSelector<T, S & MixinPropertyWithMappedValue<P, E>>;


    select(...args: any[]): any {
        if (args.length === 1 && args[0] instanceof Function) {
            this._selectProperty(this._fetchProperty(args[0]));
        } else if (args.length === 1 && args[0] instanceof Array) {
            let properties = propertiesOf(this._type);

            for (let k in properties) {
                this._selectProperty(properties[k]);
            }
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
        if (!isFlagged(property, "expandable")) {
            throw new Error(`property '${property.key}' is not expandable`);
        }

        return property.value instanceof Function ? new property.value() : property.value;
    }

    private _selectProperty(property: Property, newValue?: any): void {
        let copy = { ...property };

        if (newValue !== void 0) {
            copy.value = newValue;
        }

        (this._selected as any)[property.key] = copy;
    }

    build(): S {
        return this._selected;
    }
}
