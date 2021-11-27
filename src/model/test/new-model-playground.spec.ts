import { Expand, Expansion } from "../../core/expansion/public";
import { Instance } from "../instance";
import { define } from "../property";

xdescribe("new model playground", () => {
    class UserModel {
        id = define(Number, { required: true });
        name = define(String);
        createdBy = define(UserModel);
        updatedBy = define(UserModel, { nullable: true });
        children = define(UserModel, { array: true });
    }

    type UserInstance = Instance<UserModel>;

    const user: UserInstance = {
        id: 823,
        updatedBy: null,
        createdBy: {
            id: 913123,
            createdBy: {
                id: 1518,
                createdBy: {
                    id: 1241,
                    createdBy: {
                        id: 123,
                        createdBy: {
                            id: 123,
                            name: "foo",
                        },
                    },
                },
            },
        },
    };

    function takesExpansion<E extends Expansion<UserInstance>>(expansion: E): typeof expansion {
        return {} as any;
    }

    takesExpansion({});

    const simpleExpansion = takesExpansion({ updatedBy: true });

    type SimpleExpandedUser = Expand<UserInstance, typeof simpleExpansion>;

    const simpleExpandedUser: SimpleExpandedUser = {
        id: 1,
        updatedBy: null,
    };

    const deepExpansion = takesExpansion({ id: true, updatedBy: true, createdBy: { createdBy: { name: true, children: { createdBy: true, name: true } } } });

    type ExpandedUserInstance = Expand<UserInstance, typeof deepExpansion>;

    const expandedUser: ExpandedUserInstance = {
        id: 1,
        createdBy: { id: 90123, createdBy: { id: 123123, name: "foo", children: [{ id: 8234, createdBy: { id: 1312 }, name: "foo" }] } },
        updatedBy: null,
    };

    it("define test", () => {
        const numberProperty = define(Number, {});
        const stringProperty = define(String, {});
        const referenceProperty = define(UserModel, {});
    });
});
