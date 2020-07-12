import { Selection } from "../../selection";
import { EntitySet } from "./entity-set";
import { InstrumentedHydration } from "./instrumented-hydration";

export interface EntityHydrator<T = any> {
    createInstrumentedHydrations(entities: EntitySet<T>, selection: Selection<T>): InstrumentedHydration<T>[];
}
