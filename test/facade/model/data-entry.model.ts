import { define } from "src";
import { MetadataModel } from "./metadata.model";

export abstract class DataEntryModel {
    metadata = define(MetadataModel);
}
