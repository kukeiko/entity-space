import { define } from "../../../lib/schema/blueprint-property";
import { DataEntryMetadataBlueprint } from "./metadata.model";

export abstract class DataEntryBlueprint {
    metadata = define(DataEntryMetadataBlueprint);
}
