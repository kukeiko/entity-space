/* eslint-disable */
export default {
    displayName: "examples-products-apps-products-api",
    preset: "../../../../../jest.preset.js",
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
    coverageDirectory: "../../../../../coverage/packages/examples/products/apps/products-api",
};
