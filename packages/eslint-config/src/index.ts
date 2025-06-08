import type { Linter } from "eslint";
import type { FlatConfigComposer } from "eslint-flat-config-utils";
import antfu from "@antfu/eslint-config";
import tailwindcss from "@yorganci/eslint-plugin-tailwindcss";

/**
 * @description Options for the configuration.
 */
export interface Options {
	/**
	 * @description Whether the configuration is for a web project.
	 */
	web: boolean;
	/**
	 * @description TailwindCSS stylesheet
	 */
	tailwindStylesheet: string;
}

/**
 * @description This configuration is based on the `@antfu/eslint-config` configuration with some additional rules.
 */
export function imageTool({ web, tailwindStylesheet }: Partial<Options> = {}): FlatConfigComposer<Linter.Config<Linter.RulesRecord>, never> {
	let config = antfu({
		react: web,
		typescript: true,
		formatters: true,
		stylistic: {
			indent: "tab",
			quotes: "double",
			semi: true,
		},
	}).append({
		rules: {
			"eslint-comments/no-unlimited-disable": ["off"],
		},
	});
	if (tailwindStylesheet) {
		config = config.append({
			plugins: {
				tailwindcss,
			},
			settings: {
				tailwindcss: {
					stylesheet: tailwindStylesheet,
				},
			},
			rules: {
				"tailwindcss/classname-order": "error",
			},
		});
	}
	return config;
}
