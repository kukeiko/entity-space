import { Expansion } from "./expansion";
import { Path } from "./path";

export class Extraction {
    readonly path: Path;
    readonly extracted: Expansion;

    constructor(args: {
        path?: Path;
        extracted: Expansion;
    }) {
        this.path = args.path || null;
        this.extracted = args.extracted;
    }
}
