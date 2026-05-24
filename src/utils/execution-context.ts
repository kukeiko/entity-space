export class ExecutionContext {
    constructor(subject: string) {
        this.#subject = subject;
    }

    readonly #subject: string;
    readonly #messages: string[] = [];

    getSubject(): string {
        return this.#subject;
    }

    addMessage(message: string): void {
        this.#messages.push(message);
    }

    getMessages(): readonly string[] {
        return this.#messages.slice();
    }
}
