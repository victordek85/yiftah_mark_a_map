#!/usr/bin/env python3
"""Cut a new release of yiftah-map-events.

    python3 tools/release.py patch|minor|major [--dry-run]

What it does:
  1. Reads the current version from <meta name="app-version"> in index.html.
  2. Bumps it (semver): patch 1.0.0 -> 1.0.1, minor -> 1.1.0, major -> 2.0.0.
  3. Moves everything under "## [Unreleased]" in CHANGELOG.md into a new
     "## [x.y.z] - YYYY-MM-DD" section and updates the compare links at the bottom.
  4. Writes the new version into index.html.
  5. Commits both files as "Release vX.Y.Z" and creates an annotated tag vX.Y.Z.

It does not push. Afterwards:
    git push --follow-tags
    gh release create vX.Y.Z --title vX.Y.Z --notes-file <printed path>

It refuses to run if the working tree has uncommitted changes (commit the work
first, so the release commit contains only the version bump) or if the
Unreleased section is empty.
"""
import datetime, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'index.html')
CHANGELOG = os.path.join(ROOT, 'CHANGELOG.md')
REPO_URL = 'https://github.com/victordek85/yiftah_mark_a_map'
META_RE = re.compile(r'(<meta name="app-version" content=")(\d+)\.(\d+)\.(\d+)(">)')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def die(msg):
    print('✖ ' + msg)
    sys.exit(1)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    if len(args) != 1 or args[0] not in ('patch', 'minor', 'major'):
        die('usage: python3 tools/release.py patch|minor|major [--dry-run]')
    part = args[0]

    html = open(INDEX, encoding='utf-8').read()
    m = META_RE.search(html)
    if not m:
        die('could not find <meta name="app-version" content="x.y.z"> in index.html')
    major, minor, patch = int(m.group(2)), int(m.group(3)), int(m.group(4))
    old = f'{major}.{minor}.{patch}'
    if part == 'major':
        major, minor, patch = major + 1, 0, 0
    elif part == 'minor':
        minor, patch = minor + 1, 0
    else:
        patch += 1
    new = f'{major}.{minor}.{patch}'
    tag = 'v' + new

    log = open(CHANGELOG, encoding='utf-8').read()
    head = '## [Unreleased]'
    if head not in log:
        die('CHANGELOG.md has no "## [Unreleased]" section')
    start = log.index(head) + len(head)
    nxt = log.find('\n## [', start)
    body = log[start:nxt if nxt != -1 else len(log)].strip()
    # the link reference block at the end is not part of the section body
    body = re.split(r'\n\[Unreleased\]:', body)[0].strip()
    if not body:
        die('the Unreleased section in CHANGELOG.md is empty; describe the changes there first')

    if not dry:
        if git('status', '--porcelain').strip():
            die('uncommitted changes; commit them first so the release commit is only the version bump')
        if git('tag', '--list', tag).strip():
            die(f'tag {tag} already exists')

    today = datetime.date.today().isoformat()
    new_log = log[:start] + f'\n\n## [{new}] - {today}\n\n{body}\n' + (log[nxt:] if nxt != -1 else '\n')
    new_log = re.sub(r'^\[Unreleased\]: .*$',
                     f'[Unreleased]: {REPO_URL}/compare/{tag}...HEAD\n[{new}]: {REPO_URL}/compare/v{old}...{tag}',
                     new_log, count=1, flags=re.M)
    new_html = META_RE.sub(lambda mm: f'{mm.group(1)}{new}{mm.group(5)}', html, count=1)

    print(f'{old} -> {new}  ({part})\n\nRelease notes:\n{body}\n')
    if dry:
        print('(dry run: nothing written)')
        return

    open(CHANGELOG, 'w', encoding='utf-8').write(new_log)
    open(INDEX, 'w', encoding='utf-8').write(new_html)
    git('add', 'index.html', 'CHANGELOG.md')
    git('commit', '-q', '-m', f'Release {tag}')
    git('tag', '-a', tag, '-m', f'yiftah-map-events {tag}')
    notes = os.path.join(tempfile.gettempdir(), f'yiftah-release-{tag}.md')
    open(notes, 'w', encoding='utf-8').write(body + '\n')
    print(f'✔ Committed and tagged {tag}. Next:')
    print('    git push --follow-tags')
    print(f'    gh release create {tag} --title {tag} --notes-file "{notes}"')


if __name__ == '__main__':
    main()
