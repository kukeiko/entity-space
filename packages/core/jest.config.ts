/* eslint-disable */
export default {
    displayName: "core",
    preset: "../../jest.preset.js",
    transform: {
        "^.+\\.[tj]s$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/tsconfig.spec.json",
            },
        ],
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    coverageDirectory: "../../coverage/packages/core",
    setupFiles: ["./jest-setup-file.ts"],
};
