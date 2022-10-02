import { IsExact } from "conditional-type-checks";
import { ExpansionValue } from "../../index";

/**
 * A default expansion is just "{}".
 */
// $ExpectType true
type DefaultIsEmpty = IsExact<ExpansionValue, {}>;

interface SomeEntity {
    id: number;
    name: string;
    children: SomeEntity[];
}

/**
 * Only true | undefined is a valid value when expanding primitives.
 */
// $ExpectType true
type OnlyTrueIsValidForPrimitives = IsExact<Exclude<ExpansionValue<SomeEntity>, true>["id"], true | undefined>;

interface Square {
    id: number;
    area: number;
    length: number;
    type: "square";
}

interface Circle {
    id: number;
    area: number;
    radius: number;
    type: "circle";
}

type Shape = Square | Circle;
type DistributedKeyOf<T> = T extends any ? keyof T : never;

/**
 * Here we're making sure that an expansion of a union type (Shape, which is Circle | Square )
 * has both the common properties (area, id, type) as well as type specific properties:
 * "radius" for Circle, "length" for Square
 */
// $ExpectType true
type MergesUnions = "radius" | "length" extends DistributedKeyOf<ExpansionValue<Shape>> ? true : false;
