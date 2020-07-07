module.exports = {
    types: [
        {
            value: "feat",
            name: "feat: A new feature",
        },
        {
            value: "fix",
            name: "fix: A bug fix",
        },
        {
            value: "docs",
            name: "docs: Documentation only changes",
        },
        {
            value: "style",
            name: "style: Changes that do not affect the meaning of the code\n (white-space, formatting, missing semi-colons, etc)",
        },
        {
            value: "refactor",
            name: "refactor: A code change that neither fixes a bug nor adds a feature",
        },
        {
            value: "perf",
            name: "perf: A code change that improves performance",
        },
        {
            value: "test",
            name: "test: Adding missing tests",
        },
        {
            value: "chore",
            name: "chore: Changes to the build process or auxiliary tools\n and libraries such as documentation generation",
        },
        {
            value: "WIP",
            name: "WIP: Work in progress",
        },
    ],

    scopes: ["core", "filter"],

    allowTicketNumber: false,
    isTicketNumberRequired: false,
    ticketNumberPrefix: "TICKET-",
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
    skipQuestions: ["body"],

    // limit subject length
    subjectLimit: 255,
    // breaklineChar: '|', // It is supported for fields body and footer.
    footerPrefix: "",
    // askForBreakingChangeFirst : true, // default is false
};
