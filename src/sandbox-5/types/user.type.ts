import { StringProperty } from "../property";

export class UserType {
    username = new StringProperty("username", false, ["creatable", "unique"]);
    password = new StringProperty("password", false, ["creatable", "patchable"]);
}

type Foo = UserType["username"]["creatable"];
