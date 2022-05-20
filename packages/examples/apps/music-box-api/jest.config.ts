/* eslint-disable */
export default {
    displayName: "examples-apps-music-box-api",
    preset: "../../../../jest.preset.js",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/tsconfig.spec.json",
        },
    },
    testEnvironment: "node",
    transform: {
        "^.+\\.[tj]s$": "ts-jest",
    },
    moduleFileExtensions: ["ts", "js", "html"],
    coverageDirectory: "../../../../coverage/packages/examples/apps/music-box-api",
};
