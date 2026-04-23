#!/usr/bin/env node
// Diff the named exports of <pkg>/src/index.ts (recursively following
// `export * from './x'`) against <pkg>/dist/index.d.ts. Mismatches are
// 100%-precision bugs (stale build, tsup misconfig, drifted re-exports).
//
// Usage (from repo root):
//   node .claude/skills/tk-bug-hunter/scripts/dist-vs-src-exports.mjs packages/core
//
// Output: JSON with src_exports, dist_exports, missing_in_dist, extra_in_dist.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = (() => {
	try {
		return require(join(process.cwd(), "node_modules", "typescript"));
	} catch {
		return require("typescript");
	}
})();

function resolveLocal(fromFile, specifier) {
	const base = dirname(fromFile);
	const candidates = [
		join(base, specifier),
		`${join(base, specifier)}.ts`,
		`${join(base, specifier)}.tsx`,
		`${join(base, specifier)}.d.ts`,
		join(base, specifier, "index.ts"),
		join(base, specifier, "index.tsx"),
		join(base, specifier, "index.d.ts"),
	];
	for (const c of candidates) if (existsSync(c)) return c;
	return null;
}

function hasExportModifier(node) {
	const mods = ts.canHaveModifiers?.(node)
		? ts.getModifiers(node)
		: node.modifiers;
	return mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function collectExports(filePath, seen = new Set()) {
	const abs = resolve(filePath);
	if (seen.has(abs)) return { names: new Set(), unresolved: [] };
	seen.add(abs);

	const result = { names: new Set(), unresolved: [] };
	if (!existsSync(abs)) {
		result.unresolved.push({ reason: "not-found", file: abs });
		return result;
	}

	const text = readFileSync(abs, "utf8");
	const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true);

	for (const stmt of sf.statements) {
		if (ts.isVariableStatement(stmt) && hasExportModifier(stmt)) {
			for (const decl of stmt.declarationList.declarations) {
				if (ts.isIdentifier(decl.name)) result.names.add(decl.name.text);
			}
			continue;
		}
		if (
			(ts.isFunctionDeclaration(stmt) ||
				ts.isClassDeclaration(stmt) ||
				ts.isTypeAliasDeclaration(stmt) ||
				ts.isInterfaceDeclaration(stmt) ||
				ts.isEnumDeclaration(stmt)) &&
			hasExportModifier(stmt) &&
			stmt.name
		) {
			result.names.add(stmt.name.text);
			continue;
		}
		if (ts.isExportDeclaration(stmt)) {
			if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
				for (const el of stmt.exportClause.elements) {
					result.names.add(el.name.text);
				}
				continue;
			}
			if (!stmt.exportClause && stmt.moduleSpecifier) {
				const spec = stmt.moduleSpecifier.text;
				if (spec.startsWith(".")) {
					const resolved = resolveLocal(abs, spec);
					if (resolved) {
						const nested = collectExports(resolved, seen);
						for (const n of nested.names) result.names.add(n);
						result.unresolved.push(...nested.unresolved);
					} else {
						result.unresolved.push({
							reason: "unresolved-relative",
							from: abs,
							specifier: spec,
						});
					}
				} else {
					result.unresolved.push({
						reason: "external-star-reexport",
						from: abs,
						specifier: spec,
					});
				}
			}
		}
	}

	return result;
}

// --- main ---
const pkg = process.argv[2];
if (!pkg) {
	console.error("Usage: node dist-vs-src-exports.mjs <package-dir>");
	process.exit(1);
}
const pkgAbs = resolve(process.cwd(), pkg);
const srcIndex = join(pkgAbs, "src", "index.ts");
const distIndex = join(pkgAbs, "dist", "index.d.ts");

const src = collectExports(srcIndex);
const dist = collectExports(distIndex);

const missing_in_dist = [...src.names].filter((n) => !dist.names.has(n));
const extra_in_dist = [...dist.names].filter((n) => !src.names.has(n));

const findings = [];
for (const name of missing_in_dist) {
	findings.push({
		rule: "exports/missing-in-dist",
		severity: "MAJOR",
		confidence: "HIGH",
		package: pkg,
		symbol: name,
		detail: `"${name}" is exported from src/index.ts but not from dist/index.d.ts — build is stale or tsup dropped it. Downstream imports will fail.`,
	});
}
for (const name of extra_in_dist) {
	findings.push({
		rule: "exports/extra-in-dist",
		severity: "MINOR",
		confidence: "HIGH",
		package: pkg,
		symbol: name,
		detail: `"${name}" exists in dist/index.d.ts but not in src/index.ts — stale dist from a prior build. Run \`pnpm build --filter=${pkg.split("/").pop()}\`.`,
	});
}

process.stdout.write(
	JSON.stringify(
		{
			package: pkg,
			src_index: relative(process.cwd(), srcIndex),
			dist_index: relative(process.cwd(), distIndex),
			src_exports: [...src.names].sort(),
			dist_exports: [...dist.names].sort(),
			missing_in_dist: missing_in_dist.sort(),
			extra_in_dist: extra_in_dist.sort(),
			unresolved: [...src.unresolved, ...dist.unresolved],
			findings,
			count: findings.length,
		},
		null,
		2,
	) + "\n",
);
