export abstract class Criterion {
    abstract readonly type: string;
    abstract contains(value: unknown): boolean;
    abstract toString(): string;
}
