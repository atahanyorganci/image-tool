import antfu from "@antfu/eslint-config";

const config = antfu({
	stylistic: {
		indent: "tab",
		quotes: "double",
		semi: true,
	},
}).append({
	rules: {
		"ts/explicit-function-return-type": [
			"error",
			{
				allowExpressions: true,
				allowTypedFunctionExpressions: true,
				allowHigherOrderFunctions: true,
			},
		],
	},
});

export default config;
