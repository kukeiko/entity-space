import { Query } from "./query";
import { HydratableQueryResult } from "./hydratable-query-result";
import { PayloadHydration } from "./payload-hydration";

export interface PayloadHydrator<T = any> {
    hydrate(hydratable: HydratableQueryResult<T>): PayloadHydration<T>[];
}
