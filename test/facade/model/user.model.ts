import { createProperty } from "src";

export class User {
    id = createProperty("id", Number, b => b.loadable());
    name = createProperty("name", String, b => b.loadable().creatable());
    createdBy = createProperty("createdBy", User, b => b.loadable(["nullable", "optional"]));
}
