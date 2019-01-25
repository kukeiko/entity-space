import { Property, Navigation } from "./properties";

export class TypeMetdata {
    constructor(args: {
        name: string;
    }) {
        this.name = args.name;
    }

    readonly name: string;

    private _properties = new Map<Property.Type, Map<string, Property>>();

    addProperty(p: Property): void {
        let map = this._properties.get(p.type);

        if (map === void 0) {
            map = new Map();
            this._properties.set(p.type, map);
        }

        map.set(p.name, p);
    }
}
