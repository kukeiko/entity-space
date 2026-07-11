import { EntityBlueprint } from "../../entity/blueprint/entity-blueprint";

const { register, number, optional } = EntityBlueprint;

export class UserRequestBlueprint {
    page = number({ optional });
    pageSize = number({ optional });
}

register(UserRequestBlueprint, { name: "user-request" });

export type UserRequest = EntityBlueprint.Type<UserRequestBlueprint>;
