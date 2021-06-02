module.exports = {
    types: [
        {
            value: "feat",
            name: "feat: a new feature",
        },
        {
            value: "fix",
            name: "fix: a bug fix",
        },
        {
            value: "health",
            name: "health: improvements to codebase health & maintainability",
        },
        {
            value: "docs",
            name: "docs: comments, documentation",
        },
        {
            value: "style",
            name: "style: formatting, linter rule applications",
        },
        {
            value: "refactor",
            name: "refactor: neither a bugfix nor a feature",
        },
        {
            value: "perf",
            name: "perf: performance improvements",
        },
        {
            value: "test",
            name: "test: anything to do with tests",
        },
        {
            value: "chore",
            name: "chore: changes to the build process or auxiliary tools and libraries",
        },
        {
            value: "wip",
            name: "wip: work in progress",
        },
    ],

    scopes: ["core", "query", "criteria", "reduction", "caching", "selection", "instance", "workspace", "metadata", "typed", "intro"],

    allowTicketNumber: true,
    isTicketNumberRequired: false,
    ticketNumberPrefix: "#",
    ticketNumberRegExp: "\\d{1,5}",

    // it needs to match the value for field type. Eg.: 'fix'
    /*
    scopeOverrides: {
      fix: [
  
        {name: 'merge'},
        {name: 'style'},
        {name: 'e2eTest'},
        {name: 'unitTest'}
      ]
    },
    */
    // override the messages, defaults are as follows
    messages: {
        type: "Select the type of change that you're committing:",
        scope: "\nDenote the scope of this change (optional):",
        // used if allowCustomScopes is true
        customScope: "Denote the scope of this change:",
        subject: "Write a short, imperative tense description of the change:\n",
        body: 'Provide a longer description of the change (optional). Use "|" to break new line:\n',
        breaking: "List any breaking changes (optional):\n",
        footer: "List any related issues (optional), e.g. #31, #34:\n",
        confirmCommit: "Are you sure you want to proceed with the commit above?",
    },

    allowCustomScopes: true,
    allowBreakingChanges: ["feat", "fix"],
    // skip any questions you want
    skipQuestions: ["footer"],

    // limit subject length
    subjectLimit: 255,
    // breaklineChar: '|', // It is supported for fields body and footer.
    footerPrefix: "",
    // askForBreakingChangeFirst : true, // default is false
};
