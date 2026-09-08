
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const LESSOPEN: string;
	export const DENO_DEPLOY_TOKEN: string;
	export const AI_AGENT: string;
	export const USER: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const npm_config_user_agent: string;
	export const HERDR_PANE_ID: string;
	export const GIT_EDITOR: string;
	export const BUN_INSTALL: string;
	export const HERDR_TAB_ID: string;
	export const TURBO_NO_UPDATE_NOTIFIER: string;
	export const npm_node_execpath: string;
	export const BROWSER: string;
	export const SHLVL: string;
	export const WT_PROFILE_ID: string;
	export const CLAUDE_CODE_MESSAGING_TOKEN: string;
	export const HOME: string;
	export const CLAUDE_CODE_BRIDGE_SESSION_ID: string;
	export const npm_config_confirmModulesRemoval: string;
	export const npm_package_json: string;
	export const HERDR_WORKSPACE_ID: string;
	export const COREPACK_ROOT: string;
	export const npm_config_auto_install_peers: string;
	export const npm_config_lockfile: string;
	export const CLAUDE_CODE_CHILD_SESSION: string;
	export const HERDR_BIN_PATH: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const COLORTERM: string;
	export const WSL_DISTRO_NAME: string;
	export const COLOR: string;
	export const NVM_DIR: string;
	export const WAYLAND_DISPLAY: string;
	export const COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
	export const FORCE_COLOR: string;
	export const LOGNAME: string;
	export const npm_config_catalog: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const NAME: string;
	export const WSL_INTEROP: string;
	export const HERDR_SOCKET_PATH: string;
	export const PULSE_SERVER: string;
	export const _: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const PLAYWRIGHT_TEST: string;
	export const npm_config_registry: string;
	export const TERM: string;
	export const npm_config_cache: string;
	export const DEBUG_COLORS: string;
	export const HERDR_ENV: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const npm_config_store_dir: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const WT_SESSION: string;
	export const XDG_RUNTIME_DIR: string;
	export const npm_config_frozen_lockfile: string;
	export const CLAUDE_EFFORT: string;
	export const DISPLAY: string;
	export const CLAUDE_PID: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const LANG: string;
	export const LS_COLORS: string;
	export const npm_lifecycle_script: string;
	export const SHELL: string;
	export const NODE_PATH: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const npm_config_verify_deps_before_run: string;
	export const CLAUDE_CODE_SESSION_ID: string;
	export const LESSCLOSE: string;
	export const npm_config_npm_globalconfig: string;
	export const CLAUDECODE: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const NVM_CD_FLAGS: string;
	export const XDG_DATA_DIRS: string;
	export const CLAUDE_CODE_EXECPATH: string;
	export const npm_config_global_prefix: string;
	export const npm_config_recursive: string;
	export const npm_config__jsr_registry: string;
	export const npm_command: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const WSL2_GUI_APPS_ENABLED: string;
	export const PNPM_HOME: string;
	export const HOSTTYPE: string;
	export const CLAUDE_CODE_MESSAGING_SOCKET: string;
	export const TURBO_TELEMETRY_DISABLED: string;
	export const WSLENV: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		LESSOPEN: string;
		DENO_DEPLOY_TOKEN: string;
		AI_AGENT: string;
		USER: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		npm_config_user_agent: string;
		HERDR_PANE_ID: string;
		GIT_EDITOR: string;
		BUN_INSTALL: string;
		HERDR_TAB_ID: string;
		TURBO_NO_UPDATE_NOTIFIER: string;
		npm_node_execpath: string;
		BROWSER: string;
		SHLVL: string;
		WT_PROFILE_ID: string;
		CLAUDE_CODE_MESSAGING_TOKEN: string;
		HOME: string;
		CLAUDE_CODE_BRIDGE_SESSION_ID: string;
		npm_config_confirmModulesRemoval: string;
		npm_package_json: string;
		HERDR_WORKSPACE_ID: string;
		COREPACK_ROOT: string;
		npm_config_auto_install_peers: string;
		npm_config_lockfile: string;
		CLAUDE_CODE_CHILD_SESSION: string;
		HERDR_BIN_PATH: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		COLORTERM: string;
		WSL_DISTRO_NAME: string;
		COLOR: string;
		NVM_DIR: string;
		WAYLAND_DISPLAY: string;
		COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
		FORCE_COLOR: string;
		LOGNAME: string;
		npm_config_catalog: string;
		pnpm_config_verify_deps_before_run: string;
		NAME: string;
		WSL_INTEROP: string;
		HERDR_SOCKET_PATH: string;
		PULSE_SERVER: string;
		_: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		PLAYWRIGHT_TEST: string;
		npm_config_registry: string;
		TERM: string;
		npm_config_cache: string;
		DEBUG_COLORS: string;
		HERDR_ENV: string;
		npm_config_node_gyp: string;
		PATH: string;
		NODE: string;
		npm_package_name: string;
		npm_config_store_dir: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		WT_SESSION: string;
		XDG_RUNTIME_DIR: string;
		npm_config_frozen_lockfile: string;
		CLAUDE_EFFORT: string;
		DISPLAY: string;
		CLAUDE_PID: string;
		NoDefaultCurrentDirectoryInExePath: string;
		LANG: string;
		LS_COLORS: string;
		npm_lifecycle_script: string;
		SHELL: string;
		NODE_PATH: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		npm_config_verify_deps_before_run: string;
		CLAUDE_CODE_SESSION_ID: string;
		LESSCLOSE: string;
		npm_config_npm_globalconfig: string;
		CLAUDECODE: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		PWD: string;
		npm_execpath: string;
		NVM_CD_FLAGS: string;
		XDG_DATA_DIRS: string;
		CLAUDE_CODE_EXECPATH: string;
		npm_config_global_prefix: string;
		npm_config_recursive: string;
		npm_config__jsr_registry: string;
		npm_command: string;
		PNPM_SCRIPT_SRC_DIR: string;
		WSL2_GUI_APPS_ENABLED: string;
		PNPM_HOME: string;
		HOSTTYPE: string;
		CLAUDE_CODE_MESSAGING_SOCKET: string;
		TURBO_TELEMETRY_DISABLED: string;
		WSLENV: string;
		INIT_CWD: string;
		EDITOR: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
