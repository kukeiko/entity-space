import { HydratableQueryResult } from "./hydratable-query-result";
import { PayloadHydration } from "./payload-hydration";

export interface PayloadHydrator {
    hydrate(hydratable: HydratableQueryResult): PayloadHydration[];
}
