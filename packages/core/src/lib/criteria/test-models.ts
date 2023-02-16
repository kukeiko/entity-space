import { define } from "../schema/blueprint-property";

export class FooBlueprint {
    // id = define(Number, { id: true, required: true });
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
    bar = define(BarBlueprint, { nullable: true });
    barOrBaz = define([BarBlueprint, BazBlueprint], { nullable: true });
    numbers = define(Number, { required: true, array: true });
    boolean = define(Boolean);
    // [todo] i expected that i could do
    //      define([Number, String, Boolean, Null])
    // instead of
    //      define([Number, String, Boolean], { nullable: true })
    primitive = define([Number, String, Boolean], { nullable: true });
    // bar = define(BarBlueprint, { required: true });
    primitives = define([Number, String, Boolean], { nullable: true, array: true, required: true });
    types = define([TypeA_Blueprint, TypeB_Blueprint]);
}

export class BarBlueprint {
    id = define(Number, { id: true, required: true });
    fooId = define(Number, { required: true });
    name = define(String, { required: true, nullable: true });
    description = define(String);
    baz = define(BazBlueprint, { required: true, array: true });
    // [todo] can not have an array that also contains null. instead, here, the "primitives" property is nullable.
    //  - so i think we need to keep "nullable" attribute so that we can have an array that can also be null,
    //  - and additionally support providing "Null" for the valueType so we can have an array that can contain null,
    //  - or a combination of both
    primitives = define([Number, String, Boolean], { nullable: true, array: true });
    boolean = define(Boolean);
    types = define([TypeA_Blueprint, TypeB_Blueprint], { array: true });
}

export class BazBlueprint {
    id = define(Number, { id: true, required: true });
    barId = define(Number, { required: true });
    level = define(Number, { required: true });
    nullsyNumber = define(Number, { nullable: true });
}

export class TypeA_Blueprint {
    id = define(Number);
    type = define("A");
    number = define(Number);
    sameNameDifferentType = define(String);
}

export class TypeB_Blueprint {
    id = define(Number);
    type = define("B");
    string = define(String);
    sameNameDifferentType = define(Number);
}
