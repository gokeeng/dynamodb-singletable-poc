#!/usr/bin/env bash

# Wrapper script to run commands with proper LocalStack environment variables.
# This sets minimal AWS env vars and then runs the provided command as a child
# process (so job control behaves the same as running the command directly).

set -euo pipefail

# Default env values for LocalStack
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-eu-west-1}
DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-http://localhost:4566}
TABLE_NAME=${TABLE_NAME:-Bookstore}
# Disable AWS CLI pager (AWS CLI v2 uses a pager by default which can spawn an
# interactive process like 'less' and cause the wrapper to appear suspended in
# some shells/environments).
AWS_PAGER=${AWS_PAGER:-""}

print_usage() {
	cat <<EOF
Usage: $(basename "$0") [--quiet|-q] -- <command> [args...]

Runs <command> with LocalStack-friendly AWS environment variables set.

Options:
	-q, --quiet   Suppress the environment summary output
	-h, --help    Show this help message

Examples:
	./scripts/with-env.sh -- aws --endpoint-url=http://localhost:4566 dynamodb list-tables --region eu-west-1
	npm run with-env -- aws dynamodb list-tables --endpoint-url=http://localhost:4566 --region eu-west-1
EOF
}

QUIET=0

# Simple arg parsing for -q/--quiet and -h/--help. We expect `--` before the
# wrapped command when invoked from npm (npm run with-env -- <cmd>), but also
# support calling the script directly with the command as args.
while [[ $# -gt 0 ]]; do
	case "$1" in
		-q|--quiet)
			QUIET=1
			shift
			;;
		-h|--help)
			print_usage
			exit 0
			;;
		--)
			shift
			break
			;;
		--* )
			# Unknown long option before --, treat as part of command
			break
			;;
		*)
			# First non-option is the start of the command
			break
			;;
	esac
done

if [ $# -eq 0 ]; then
	echo "Error: no command provided."
	echo
	print_usage
	exit 2
fi

export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION"
export DYNAMODB_ENDPOINT="$DYNAMODB_ENDPOINT"
export TABLE_NAME="$TABLE_NAME"
export AWS_PAGER="$AWS_PAGER"

if [ $QUIET -ne 1 ]; then
	echo "🌍 Environment configured for LocalStack:"
	echo "   AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
	echo "   AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"
	echo "   AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION"
	echo "   DYNAMODB_ENDPOINT: $DYNAMODB_ENDPOINT"
	echo "   TABLE_NAME: $TABLE_NAME"
	echo ""
fi

# Run the provided command as a child process. We intentionally avoid exec to
# preserve shell job control semantics in interactive shells.
"$@"
exit_code=$?
exit $exit_code