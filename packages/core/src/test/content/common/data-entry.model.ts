import { define } from "@entity-space/common";
import { DataEntryMetadataBlueprint } from "./metadata.model";

export abstract class DataEntryBlueprint {
    metadata = define(DataEntryMetadataBlueprint);
}
