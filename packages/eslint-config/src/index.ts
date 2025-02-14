import type { Linter } from "eslint";
import type { FlatConfigComposer } from "eslint-flat-config-utils";
import antfu from "@antfu/eslint-config";

/**
 * @description Options for the configuration.
 */
export interface Options {
	/**
	 * @description Whether the configuration is for a web project.
	 */
	web: boolean;
}

/**
 * @description This configuration is based on the `@antfu/eslint-config` configuration with some additional rules.
 */
export function imageTool({ web }: Partial<Options> = {}): FlatConfigComposer<Linter.Config<Linter.RulesRecord>, never> {
	return antfu({
		react: web,
		typescript: true,
		formatters: true,
		stylistic: {
			indent: "tab",
			quotes: "double",
			semi: true,
		},
	});
}
