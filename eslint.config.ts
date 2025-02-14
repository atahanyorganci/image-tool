import { imageTool } from "@yorganci/image-tool-eslint-config";

export default imageTool().append({
	ignores: [
		"packages/image-tool",
		"packages/eslint-config",
		"packages/web",
	],
});
