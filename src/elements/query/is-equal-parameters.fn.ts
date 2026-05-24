import { isEqual } from "lodash";
import { EntityQueryParameters } from "./entity-query-parameters";

export function isEqualParameters(a?: EntityQueryParameters, b?: EntityQueryParameters): boolean {
    return isEqual(a?.getValue(), b?.getValue());
}
