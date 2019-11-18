import { Type } from "./type";
import { propertiesOf } from "./property";
import { Selection } from "./selection";

export module OData {
    export function buildExpandSelectQueryStrings<T extends Type | Selection>(type: T): { $expand: string; $select: string; } {
        let properties = propertiesOf(type);

        for (let k in properties) {
            properties[k].key;
        }

        return {
            $expand: "",
            $select: ""
        };
    }
}
