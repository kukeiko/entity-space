import { createProperty } from "src";

export class UserModel {
    id = createProperty("id", Number, b => b.loadable());
    name = createProperty("name", String, b => b.loadable().creatable());
}
