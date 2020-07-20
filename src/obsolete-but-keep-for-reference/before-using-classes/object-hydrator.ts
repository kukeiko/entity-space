import { Selection } from "../selection";
import { ObjectHydration } from "./object-hydration";
import { HydratableQueryResult } from "./hydratable-query-result";

export interface ObjectHydrator {
    hydrate(hydratable: HydratableQueryResult): ObjectHydration[];
}
