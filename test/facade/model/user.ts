import { Property } from "../../../src/advanced/property";

export class User {
    id = Property.create("id", Number, b => b.loadable());
    name = Property.create("name", String, b => b.loadable().creatable());
    createdBy = Property.create("createdBy", User, b => b.loadable(["nullable", "optional"]));
}
