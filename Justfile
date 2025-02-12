name    := `jq -r '.name' package.json`
version := `jq -r '.version' package.json`

attw:
    pnpm run attw

build:
    pnpm run build

check:
    pnpm run check

lint:
    pnpm run lint

test:
    pnpm run test

ci: check lint test

@pre-publish: ci build attw
    echo "Ready for publishing"

[private]
is-clean:
    #!/usr/bin/env bash

    if [[ -n $(git status --porcelain) ]]; then
        echo "Repository is dirty, commit or stash changes and try again."
        exit 1
    fi

[confirm("Are you sure you want to publish new version of the package?")]
@publish NEW_VERSION: is-clean pre-publish
    echo "Updating {{ name }} from v{{ version }} to v{{ NEW_VERSION }}"
    sed -i 's/"version": "{{ version }}"/"version": "{{ NEW_VERSION }}"/g' package.json jsr.json
    git add package.json jsr.json
    git commit -m "{{ NEW_VERSION }}"
    git tag 'v{{ NEW_VERSION }}' -m "{{ NEW_VERSION }}"
