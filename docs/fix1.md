OpenCode
Run OpenCode from a checkout of this repo (the plugin reuses its hooks/ and skills/), and add to opencode.json:

{ "plugin": ["./.opencode/plugins/ponytail.mjs"] }
Injects the ruleset every turn at the active level; adds the /ponytail commands (see Commands). OpenCode also auto-loads this repo's AGENTS.md, so the rules hold even without the plugin. The plugin adds the lite/full/ultra/off levels.

The ./ path resolves against your project's opencode.json; to share one checkout across projects, point it at the absolute path of the .mjs instead (it finds its hooks/ and skills/ relative to its own file).

The plugin path loads the ruleset everywhere, but the /ponytail commands are separate files in .opencode/command/ that OpenCode only discovers from your project or the global commands dir. To use them outside this checkout, link them once: ln -sf /absolute/path/to/ponytail/.opencode/command/* ~/.config/opencode/command/.