import { expect, Mock } from "vitest";

expect.extend({
    toHaveBeenCalledBefore(received?: Mock | null, other?: Mock | null) {
        if (!received?.mock || !other?.mock) {
            return {
                pass: false,
                message: () => "Both arguments must be mocked functions or spies",
            };
        }

        const receivedCall = received.mock.invocationCallOrder[0];
        const otherCall = other.mock.invocationCallOrder[0];

        const pass = receivedCall < otherCall;

        return {
            pass,
            message: () =>
                pass
                    ? "Expected function NOT to be called before the other"
                    : "Expected function to be called before the other",
        };
    },
    toHaveBeenCalledAfter(received?: Mock | null, other?: Mock | null) {
        if (!received?.mock || !other?.mock) {
            return {
                pass: false,
                message: () => "Both arguments must be mocked functions or spies",
            };
        }

        const receivedCall = received.mock.invocationCallOrder[0];
        const otherCall = other.mock.invocationCallOrder.at(-1)!;

        const pass = receivedCall > otherCall;

        return {
            pass,
            message: () =>
                pass
                    ? "Expected function to be called before the other"
                    : "Expected function NOT to be called before the other",
        };
    },
});
