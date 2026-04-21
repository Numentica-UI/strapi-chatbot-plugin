const COMMIT_REGEX = /^(feat|fix|refactor|docs|test|chore)\([a-z0-9][a-z0-9-]*\): #[0-9]+ .+$/;

module.exports = {
  plugins: [
    {
      rules: {
        'header-match-workflow': (parsed) => {
          const header = parsed.header || '';
          const isValid = COMMIT_REGEX.test(header);

          return [
            isValid,
            [
              'Commit message must match:',
              '  type(scope): #issue-number message',
              '',
              'Allowed types: feat, fix, refactor, docs, test, chore',
              'Examples:',
              '  feat(auth): #42 add JWT login',
              '  fix(api): #87 handle null response',
              '',
              `Regex: ${COMMIT_REGEX}`,
            ].join('\n'),
          ];
        },
      },
    },
  ],
  rules: {
    'header-match-workflow': [2, 'always'],
  },
};