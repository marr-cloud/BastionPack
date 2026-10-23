import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { freshChangelog } from "./lib/changelog.ts";
import { BastionError, main } from "./lib/errors.ts";
import { readConfig, writeConfig } from "./lib/lock.ts";
import { repoRoot } from "./lib/paths.ts";
import { renderInstanceCfg } from "./prism.ts";

const DOCS = "docs/troubleshooting.md";
const TEMPLATE_NAME = "BastionPack";
const SLUG = /^[a-z0-9][a-z0-9_-]{1,63}$/i;

export type InitAnswers = {
    name: string;
    author: string;
    description: string;
    modrinthSlug?: string;
};

function invalid(message: string, hint: string): BastionError {
    return new BastionError(message, { hint, docs: `${DOCS}#init-invalid-input` });
}

function validate(a: InitAnswers): void {
    if (a.name.trim() === "" || /[\r\n]/.test(a.name)) {
        throw invalid(
            "The pack name must be a non-empty single line",
            'pass e.g. --name "My Pack"',
        );
    }
    if (a.author.trim() === "" || /[\r\n]/.test(a.author)) {
        throw invalid(
            "The author must be a non-empty single line",
            'pass e.g. --author "Your Name"',
        );
    }
    if (a.description.trim() === "" || /[\r\n]/.test(a.description)) {
        throw invalid(
            "The description must be a non-empty single line",
            'pass e.g. --description "A short summary"',
        );
    }
    if (a.modrinthSlug !== undefined && !SLUG.test(a.modrinthSlug)) {
        throw invalid(
            `"${a.modrinthSlug}" is not a valid Modrinth slug`,
            "use the project slug from its Modrinth URL (letters, digits, - and _), or omit it",
        );
    }
}

export function renderReadme(a: InitAnswers): string {
    const link = a.modrinthSlug
        ? ` Get it on [Modrinth](https://modrinth.com/modpack/${a.modrinthSlug}).`
        : "";
    return `# ${a.name}

${a.description}

## Install

Install with the Modrinth App or Prism Launcher by importing the \`.mrpack\`.${link}

## Built with BastionPack

This pack is built from the [BastionPack](https://github.com/marr-cloud/BastionPack) template. See [docs/getting-started.md](docs/getting-started.md) to develop, test and release it.
`;
}

export function assertNotInitialized(cfg: { name: string }, force = false): void {
    if (cfg.name !== TEMPLATE_NAME && !force) {
        throw new BastionError(`This repository is already initialized as "${cfg.name}"`, {
            hint: "re-run with --force to initialize again",
            docs: `${DOCS}#init-already-initialized`,
        });
    }
}

/**
 * Turns a fresh template checkout into the packdev's own pack. pakku.json is written last: it is
 * the "initialized" marker, so a failure before it leaves the repo re-runnable without --force.
 */
export function applyInit(root: string, a: InitAnswers, opts: { force?: boolean } = {}): void {
    validate(a);
    const cfg = readConfig(root);
    assertNotInitialized(cfg, opts.force);
    const instanceCfg = renderInstanceCfg(a.name); // validate before any write

    let markerWritten = false;
    try {
        writeFileSync(join(root, ".pakku/prism-overrides/instance.cfg"), instanceCfg);
        writeFileSync(join(root, "CHANGELOG.md"), freshChangelog());
        writeFileSync(join(root, "README.md"), renderReadme(a));
        rmSync(join(root, "docs/superpowers"), { recursive: true, force: true });

        const envFile = join(root, "server/.env.example");
        if (a.modrinthSlug && existsSync(envFile)) {
            const env = readFileSync(envFile, "utf8");
            const eol = env.includes("\r\n") ? "\r\n" : "\n";
            const lines = env.split(/\r?\n/);
            const example = `# MODRINTH_MODPACK=${a.modrinthSlug}`;
            const i = lines.findIndex((l) => /^#?\s*MODRINTH_MODPACK=/.test(l));
            if (i !== -1 && lines[i + 1] !== example) {
                lines.splice(i + 1, 0, example);
                writeFileSync(envFile, lines.join(eol));
            }
        }

        writeConfig(root, {
            ...cfg,
            name: a.name,
            author: a.author,
            description: a.description,
            version: "0.0.0-dev",
        });
        markerWritten = true;
    } catch (e) {
        if (e instanceof BastionError) throw e;
        const cause = e instanceof Error ? e.message : String(e);
        throw new BastionError(`init failed partway: ${cause}`, {
            hint: markerWritten
                ? "re-run with --force"
                : "fix the cause and run `task init` again (pakku.json was not changed)",
            docs: `${DOCS}#init-failed`,
        });
    }
}

export type InitArgs = Partial<InitAnswers> & { force: boolean };

const FLAGS: Record<string, "name" | "author" | "description" | "modrinthSlug"> = {
    "--name": "name",
    "--author": "author",
    "--description": "description",
    "--modrinth-slug": "modrinthSlug",
};

export function parseInitArgs(argv: string[]): InitArgs {
    const out: InitArgs = { force: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i] ?? "";
        if (arg === "--force") {
            out.force = true;
            continue;
        }
        const eq = arg.indexOf("=");
        const flag = eq === -1 ? arg : arg.slice(0, eq);
        const key = FLAGS[flag];
        if (key === undefined) {
            throw invalid(
                `Unknown argument "${arg}"`,
                "usage: task init -- [--name N] [--author A] [--description D] [--modrinth-slug S] [--force]",
            );
        }
        const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
        if (value === undefined) throw invalid(`${flag} needs a value`, `usage: ${flag} <value>`);
        out[key] = value;
    }
    return out;
}

async function collect(args: InitArgs): Promise<InitAnswers> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const ask = async (label: string, given: string | undefined, optional = false) =>
            given ?? (await rl.question(`${label}${optional ? " (optional)" : ""}: `)).trim();
        const name = await ask("Pack name", args.name);
        const author = await ask("Author", args.author);
        const description = await ask("Description", args.description);
        const slug = await ask("Modrinth slug", args.modrinthSlug, true);
        return { name, author, description, ...(slug ? { modrinthSlug: slug } : {}) };
    } finally {
        rl.close();
    }
}

if (import.meta.main) {
    main(async () => {
        const args = parseInitArgs(process.argv.slice(2));
        const root = repoRoot();
        assertNotInitialized(readConfig(root), args.force);
        const answers = await collect(args);
        applyInit(root, answers, { force: args.force });
        console.log(
            `Initialized "${answers.name}". Review the changes with \`git status\`, then commit.`,
        );
    });
}
