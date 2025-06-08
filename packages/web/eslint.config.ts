import { imageTool } from "@yorganci/image-tool-eslint-config";

const config = imageTool({
	web: true,
	tailwindStylesheet: "src/styles/global.css",
});

export default config;
