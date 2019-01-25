import { Local } from "@metadata";

export class Selection {
    // readonly locals: ReadonlyArray<Local>;
    private _locals = new Map<string, Local>();

    constructor(args: {
        locals: Local[];
    }) {
        this._locals
        // this.locals = Object.freeze(args.locals.slice().sort((a, b) => a.name.localeCompare(b.name)));
    }
}

export module Selection {
    export function minus(a: Selection, b: Selection): Selection {

    }
}

// static minus(x: ArrayLike<Expansion>, y: ArrayLike<Expansion>): Expansion[] {
//     if (x.length == 0 || y.length == 0) return Array.from(x).slice();

//     let result: Expansion[] = [];
//     let xi = 0;
//     let yi = 0;

//     x = Array.from(x).slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);
//     y = Array.from(y).slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);

//     while (true) {
//         if (x[xi] == null) {
//             break;
//         } else if (y[yi] == null) {
//             result = [...result, ...Array.from(x).slice(xi)];
//             break;
//         } else if (x[xi].property == y[yi].property) {
//             let remaining = Expansion.minus(x[xi].expansions.slice(), y[yi].expansions.slice());

//             if (remaining.length > 0) {
//                 result = [...result, new Expansion({
//                     property: x[xi].property,
//                     expansions: remaining
//                 })];
//             }

//             xi++;
//             yi++;
//         } else if (x[xi].property.name < y[yi].property.name) {
//             result.push(x[xi]);
//             xi++;
//         } else {
//             yi++;
//         }
//     }

//     return result;
// }