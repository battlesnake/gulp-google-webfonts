#!/bin/bash

# Literal markdown, by Mark K Cowan mark@battlesnake.co.uk
#
# Special lines are lines beginning with:
#  : [dir] - enter directory [dir], relative to LMD file
#  < [file] - read contents of [file] and tab-indent it into MD file
#  | [shell_cmd] - execute [shell_cmd] and tab-indent outputs into MD file
#  $ [shell_cmd] - execute [shell_cmd] and direct outputs to STDERR
#
# Special lines must not be indented, the first character on the line must be
# the special character.

set -euo pipefail

if [ "${1:---help}" == "--help" ]; then
	printf -- "Syntax: make-docs.sh <docfile>.lmd\n\n"
	printf -- "Write output to <docfile>.md\n\n"
	false
fi

declare -r root="$(realpath "$(dirname "$1")")"
declare -r in="$(basename "$1")"
declare -r out="${in%.lmd}.md"

rm -f -- node_modules/bin/google-webfonts node_modules/gulp-google-webfonts
ln -srf index.js node_modules/.bin/google-webfonts
ln -srf . node_modules/gulp-google-webfonts
export PATH="$PATH:$PWD/node_modules/.bin"

cd "${root}"

function indent {
	local line
	while IFS='' read line; do
		printf -- "\t%s\n" "${line}"
	done
}

function enter_dir {
	local -r dir="$1"
	cd "${root}/${dir}"
}

function read_in {
	local -r file="$1"
	printf >&2 -- "Read '%s' from '%s'\n" "${file}" "${PWD}"
	<"${file}" indent
}

function pipe_in {
	local -ra args=( $@ )
	printf >&2 -- "Pipe in"
	printf >&2 -- " '%s'" "${args[@]}"
	printf >&2 -- " from '%s'\n" "${PWD}"
	"${args[@]}" | indent
}

function map_line {
	local -r line="$1"

	local -r first="${line:0:1}"
	local -r rest="$(echo "${line:1}" | sed -e 's/^\s*//')"

	case "${first}" in
	":") enter_dir "${rest}";;
	"<") read_in "${rest}";;
	"|") pipe_in "${rest}";;
	"$") >&2 eval "${rest}";;
	*) printf -- "%s\n" "${line}";;
	esac
}

while IFS='' read __line; do

	map_line "${__line}"

done < "${in}" > "${out}"
