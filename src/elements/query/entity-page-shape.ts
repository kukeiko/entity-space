export class EntityPageShape {
    constructor(isRequired = false) {
        this.#isRequired = isRequired;
    }

    readonly #isRequired: boolean;

    isRequired(): boolean {
        return this.#isRequired;
    }
}
