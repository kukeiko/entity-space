export abstract class CriterionBase {
    abstract contains(item: unknown): boolean;

    filter<T>(items: T[]): T[] {
        return items.filter(item => this.contains(item));
    }
}
