#!/usr/bin/env node
// AST-based verifier for rules-of-hooks + SSR module-scope hazards.
// Uses the TypeScript compiler API — no new deps required (resolves `typescript`
// from the repo-root node_modules at process.cwd()).
//
// Usage (from repo root):
//   node .claude/skills/tk-bug-hunter/scripts/ast-rules-of-hooks.mjs packages/core [packages/react ...]
//
// Output: JSON `{ findings: [...], count: N }` on stdout.
// Exit code is always 0 — tk-bug-hunter decides severity. Findings are HIGH-confidence
// because the AST disambiguates control flow that regex cannot.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadTypescript() {
	try {
		return require(join(process.cwd(), "node_modules", "typescript"));
	} catch {
		try {
			return require("typescript");
		} catch {
			console.error(
				"[ast-rules-of-hooks] Cannot resolve typescript. Run `pnpm install` at the repo root.",
			);
			process.exit(2);
		}
	}
}

const ts = loadTypescript();

const SKIP_DIRS = new Set([
	"node_modules",
	"dist",
	"build",
	"coverage",
	".turbo",
	".next",
	"__tests__",
	"__mocks__",
]);

function walkSources(dir, out = []) {
	let entries;
	try {
		entries = readdirSync(dir);
	} catch {
		return out;
	}
	for (const entry of entries) {
		if (entry.startsWith(".") || SKIP_DIRS.has(entry)) continue;
		const full = join(dir, entry);
		const st = statSync(full);
		if (st.isDirectory()) {
			walkSources(full, out);
		} else if (
			/\.(tsx?|mts|cts)$/.test(entry) &&
			!/\.(test|spec)\.(tsx?|mts|cts)$/.test(entry) &&
			!/\.d\.ts$/.test(entry)
		) {
			out.push(full);
		}
	}
	return out;
}

function posOf(sf, node) {
	const { line, character } = sf.getLineAndCharacterOfPosition(
		node.getStart(sf),
	);
	return { line: line + 1, col: character + 1 };
}

function isHookName(name) {
	return /^use[A-Z]/.test(name);
}

function isFunctionLike(node) {
	return (
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isArrowFunction(node) ||
		ts.isMethodDeclaration(node) ||
		ts.isConstructorDeclaration(node) ||
		ts.isGetAccessorDeclaration(node) ||
		ts.isSetAccessorDeclaration(node)
	);
}

function containingFunctionDepth(node) {
	let depth = 0;
	let cur = node.parent;
	while (cur) {
		if (isFunctionLike(cur)) depth++;
		cur = cur.parent;
	}
	return depth;
}

// A hook call is "conditional" when its nearest control-flow ancestor
// inside the same function makes execution of THIS node conditional.
// Binary short-circuit operators only make the right operand conditional.
// Ternary conditionals only make whenTrue/whenFalse conditional (not the `cond` expr).
function containingConditional(node) {
	let cur = node.parent;
	let prev = node;
	while (cur) {
		if (isFunctionLike(cur) || ts.isSourceFile(cur)) return null;
		if (
			ts.isIfStatement(cur) ||
			ts.isSwitchStatement(cur) ||
			ts.isCaseClause(cur) ||
			ts.isDefaultClause(cur) ||
			ts.isForStatement(cur) ||
			ts.isForInStatement(cur) ||
			ts.isForOfStatement(cur) ||
			ts.isWhileStatement(cur) ||
			ts.isDoStatement(cur) ||
			ts.isCatchClause(cur)
		) {
			return cur;
		}
		if (ts.isConditionalExpression(cur)) {
			if (prev === cur.whenTrue || prev === cur.whenFalse) return cur;
		}
		if (
			ts.isBinaryExpression(cur) &&
			(cur.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
				cur.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
				cur.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
		) {
			if (prev === cur.right) return cur;
		}
		prev = cur;
		cur = cur.parent;
	}
	return null;
}

// `if (x) return; useFoo();` — detect a conditional return that executes before
// the hook call. Only if/switch/try statements can host a conditional early return.
// The statement must end before the call starts (otherwise we'd match the call's
// own enclosing return statement).
function hasEarlyReturnBefore(callNode) {
	let fn = callNode.parent;
	while (fn && !isFunctionLike(fn)) fn = fn.parent;
	if (!fn || !fn.body || !ts.isBlock(fn.body)) return null;
	const callStart = callNode.getStart();
	for (const stmt of fn.body.statements) {
		if (stmt.getEnd() > callStart) break;
		if (
			!ts.isIfStatement(stmt) &&
			!ts.isSwitchStatement(stmt) &&
			!ts.isTryStatement(stmt)
		)
			continue;
		let found = null;
		function visit(n) {
			if (found) return;
			if (ts.isReturnStatement(n)) {
				found = n;
				return;
			}
			if (isFunctionLike(n)) return;
			ts.forEachChild(n, visit);
		}
		visit(stmt);
		if (found) return stmt;
	}
	return null;
}

// Detect an enclosing `if (typeof window !== 'undefined')` or similar SSR guard.
function isGuardedByTypeofCheck(node) {
	const GUARD =
		/typeof\s+(window|document|navigator|self|globalThis)\s*[!=]==?\s*['"]undefined['"]|typeof\s+['"]undefined['"]\s*[!=]==?\s*typeof\s+(window|document|navigator|self|globalThis)/;
	let cur = node.parent;
	while (cur) {
		if (ts.isIfStatement(cur) && GUARD.test(cur.expression.getText())) return true;
		if (ts.isConditionalExpression(cur) && GUARD.test(cur.condition.getText()))
			return true;
		if (
			ts.isBinaryExpression(cur) &&
			(cur.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
				cur.operatorToken.kind === ts.SyntaxKind.BarBarToken) &&
			GUARD.test(cur.left.getText())
		)
			return true;
		cur = cur.parent;
	}
	return false;
}

function rootOfAccessChain(node) {
	let root = node;
	while (
		ts.isPropertyAccessExpression(root) ||
		ts.isElementAccessExpression(root) ||
		ts.isCallExpression(root) ||
		ts.isNonNullExpression(root)
	) {
		root = root.expression;
	}
	return root;
}

function checkFile(filePath, out) {
	const text = readFileSync(filePath, "utf8");
	const sf = ts.createSourceFile(
		filePath,
		text,
		ts.ScriptTarget.Latest,
		true,
		filePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);
	const rel = relative(process.cwd(), filePath);
	const reported = new Set();
	const dedupe = (key) => {
		if (reported.has(key)) return false;
		reported.add(key);
		return true;
	};

	function visit(node) {
		// === Rule: hook call inside conditional control flow ===
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			isHookName(node.expression.text)
		) {
			const cond = containingConditional(node);
			if (cond) {
				const { line, col } = posOf(sf, node);
				if (dedupe(`cond:${rel}:${line}:${col}`)) {
					out.push({
						rule: "rules-of-hooks/conditional-call",
						severity: "MAJOR",
						confidence: "HIGH",
						file: rel,
						line,
						col,
						evidence: node.getText(sf).slice(0, 160),
						detail: `Hook "${node.expression.text}" called inside ${ts.SyntaxKind[cond.kind]} — violates rules-of-hooks.`,
					});
				}
			} else {
				const early = hasEarlyReturnBefore(node);
				if (early) {
					const { line, col } = posOf(sf, node);
					if (dedupe(`early:${rel}:${line}:${col}`)) {
						out.push({
							rule: "rules-of-hooks/after-early-return",
							severity: "MAJOR",
							confidence: "HIGH",
							file: rel,
							line,
							col,
							evidence: node.getText(sf).slice(0, 160),
							detail: `Hook "${node.expression.text}" called after a conditional early-return — rules-of-hooks requires unconditional hook order.`,
						});
					}
				}
			}

			// === Rule: async function passed directly to useEffect/useLayoutEffect/useInsertionEffect ===
			if (
				/^use(Effect|LayoutEffect|InsertionEffect)$/.test(node.expression.text)
			) {
				const first = node.arguments[0];
				if (
					first &&
					(ts.isArrowFunction(first) || ts.isFunctionExpression(first))
				) {
					const mods =
						(ts.canHaveModifiers?.(first)
							? ts.getModifiers(first)
							: first.modifiers) || [];
					if (mods.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
						const { line, col } = posOf(sf, first);
						if (dedupe(`async:${rel}:${line}:${col}`)) {
							out.push({
								rule: "react/async-effect",
								severity: "MAJOR",
								confidence: "HIGH",
								file: rel,
								line,
								col,
								evidence: first.getText(sf).slice(0, 160),
								detail:
									"Async function passed directly to effect hook — the return is a promise, not a cleanup. Define an inner async function and call it instead.",
							});
						}
					}
				}
			}
		}

		// === Rule: module-scope DOM/BOM access ===
		if (
			ts.isPropertyAccessExpression(node) ||
			ts.isElementAccessExpression(node)
		) {
			const root = rootOfAccessChain(node);
			if (
				ts.isIdentifier(root) &&
				/^(window|document|navigator|localStorage|sessionStorage)$/.test(
					root.text,
				)
			) {
				const depth = containingFunctionDepth(node);
				if (depth === 0 && !isGuardedByTypeofCheck(node)) {
					const p = node.parent;
					const isInnerOfLongerAccess =
						p &&
						(ts.isPropertyAccessExpression(p) ||
							ts.isElementAccessExpression(p)) &&
						p.expression === node;
					if (!isInnerOfLongerAccess) {
						const { line, col } = posOf(sf, node);
						if (dedupe(`ssr:${rel}:${line}:${col}`)) {
							out.push({
								rule: "ssr/module-scope-dom",
								severity: "BLOCKER",
								confidence: "HIGH",
								file: rel,
								line,
								col,
								evidence: node.getText(sf).slice(0, 160),
								detail: `"${root.text}" accessed at module scope without a typeof guard — crashes SSR (Next.js) builds.`,
							});
						}
					}
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sf);
}

// --- main ---
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (args.length === 0) {
	console.error(
		"Usage: node ast-rules-of-hooks.mjs <package-dir> [<package-dir>...]",
	);
	process.exit(1);
}

const findings = [];
for (const pkg of args) {
	const srcDir = resolve(process.cwd(), pkg, "src");
	try {
		statSync(srcDir);
	} catch {
		console.error(`[skip] No src directory at ${srcDir}`);
		continue;
	}
	for (const file of walkSources(srcDir)) checkFile(file, findings);
}

process.stdout.write(
	JSON.stringify({ findings, count: findings.length }, null, 2) + "\n",
);
