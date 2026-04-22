#!/usr/bin/env sh

CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD)"
BRANCH_REGEX='^(feat|fix|refactor|docs|test|chore)/[0-9]+/[a-z0-9]+(-[a-z0-9]+)*$'

if [ -z "$CURRENT_BRANCH" ]; then
  echo "Skipping branch name validation: detached HEAD."
  exit 0
fi

if ! printf '%s' "$CURRENT_BRANCH" | grep -Eq "$BRANCH_REGEX"; then
  echo ""
  echo "Invalid branch name: $CURRENT_BRANCH"
  echo ""
  echo "Branch name must match:"
  echo "  type/issue-number/short-name"
  echo ""
  echo "Allowed types: feat, fix, refactor, docs, test, chore"
  echo "Examples:"
  echo "  feat/42/jwt-login"
  echo "  fix/87/null-response"
  echo ""
  echo "Regex: $BRANCH_REGEX"
  echo ""
  echo "How to fix:"
  echo "  git branch -m feat/42/your-short-name"
  echo ""
  exit 1
fi
