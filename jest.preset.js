const nxPreset = require("@nrwl/jest/preset").default;

module.exports = { ...nxPreset, modulePathIgnorePatterns: ["test/types"] };
