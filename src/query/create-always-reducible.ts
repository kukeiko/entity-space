import { Reducible } from "./reducible";

export function createAlwaysReducible(): Reducible {
    return {
        reduce() {
            return null;
        },
    };
}
