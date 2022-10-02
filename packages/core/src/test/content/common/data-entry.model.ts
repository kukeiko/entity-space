import { define } from "@entity-space/core";
import { DataEntryMetadataBlueprint } from "./metadata.model";

export abstract class DataEntryBlueprint {
    metadata = define(DataEntryMetadataBlueprint);
}
