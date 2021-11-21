import { define } from "src";

export class UserModel {
    id = define(Number, { id: true, required: true, readOnly: true });
    name = define(String);
}
