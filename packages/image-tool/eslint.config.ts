import { imageTool } from "@yorganci/image-tool-eslint-config";

const config = imageTool().append({
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
