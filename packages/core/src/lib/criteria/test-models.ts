import { define } from "../schema/blueprint-property";

export class FooBlueprint {
    // id = define(Number, { id: true, required: true });
    id = define(Number, { id: true });
    name = define(String, { required: true });
    bar = define(BarBlueprint, { nullable: true });
    numbers = define(Number, { required: true, array: true });
    // bar = define(BarBlueprint, { required: true });
}

export class BarBlueprint {
    id = define(Number, { id: true, required: true });
    fooId = define(Number, { required: true });
    name = define(String, { required: true, nullable: true });
    description = define(String);
    baz = define(BazBlueprint, { required: true, array: true });
}

export class BazBlueprint {
    id = define(Number, { id: true, required: true });
    barId = define(Number, { required: true });
    level = define(Number, { required: true });
}
