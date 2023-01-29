import { define } from "../../../lib/common/schema/blueprint-property";
import { DataEntryMetadataBlueprint } from "./metadata.model";

export abstract class DataEntryBlueprint {
    metadata = define(DataEntryMetadataBlueprint);
}
