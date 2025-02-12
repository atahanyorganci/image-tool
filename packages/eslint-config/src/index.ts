import type { Linter } from "eslint";
import type { FlatConfigComposer } from "eslint-flat-config-utils";
import antfu from "@antfu/eslint-config";

/**
 * @description This configuration is based on the `@antfu/eslint-config` configuration with some additional rules.
 */
export function imageTool(): FlatConfigComposer<Linter.Config<Linter.RulesRecord>, never> {
	return antfu({
		typescript: true,
		formatters: true,
		stylistic: {
			indent: "tab",
			quotes: "double",
			semi: true,
		},
	});
}
