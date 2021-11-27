import { define } from "@entity-space/model";

export class UserModel {
    id = define(Number, { id: true, required: true, readOnly: true });
    name = define(String);
}
