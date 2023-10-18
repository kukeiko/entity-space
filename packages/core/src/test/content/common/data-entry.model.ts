import { define } from "../../../lib/schema/entity-blueprint-property";
import { DataEntryMetadataBlueprint } from "./metadata.model";

export abstract class DataEntryBlueprint {
    metadata = define(DataEntryMetadataBlueprint, { optional: true });
}
