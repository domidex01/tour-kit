#!/usr/bin/env node
// Stamps the BSL 1.1 Change Date (publication date + 4 years, the spec maximum)
// into every Pro package's LICENSE.md. Runs inside `pnpm release` immediately
// before `changeset publish`, so each published tarball carries a Change Date
// no older than its publication window. The Licensed Work field carries no
// version on purpose (matches packages/core/LICENSE.md on main) — nothing else
// in the file is release-dependent.
// ponytail: assumes the Pro release train moves in lockstep — all 9 packages get
// the same stamp regardless of which are being published. If trains ever split,
// parse the changeset publish manifest instead.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PRO_PACKAGES = [
	"adoption",
	"ai",
	"analytics",
	"announcements",
	"checklists",
	"license",
	"media",
	"scheduling",
	"surveys",
];

const stamp = new Date();
stamp.setFullYear(stamp.getFullYear() + 4);
const changeDate = stamp.toISOString().slice(0, 10);

let failed = false;
for (const name of PRO_PACKAGES) {
	const file = join("packages", name, "LICENSE.md");
	const text = readFileSync(file, "utf8");

	if (!/^Change Date:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(text)) {
		console.error(`ERROR: ${file} has no "Change Date: <ISO date>" line — refusing to publish`);
		failed = true;
		continue;
	}

	writeFileSync(file, text.replace(/^Change Date:.*$/m, `Change Date:          ${changeDate}`));
}

if (failed) process.exit(1);
console.log(`Stamped Change Date ${changeDate} in ${PRO_PACKAGES.length} Pro LICENSE.md files`);
