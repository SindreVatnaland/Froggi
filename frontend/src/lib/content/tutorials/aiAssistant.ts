import type { Tutorial } from './types';

export const aiAssistantTutorial: Tutorial = {
	id: 'ai-assistant',
	title: 'AI assistant',
	description: 'Connect Claude or another AI app to build overlays and flows, and fix problems with you.',
	icon: 'Bot',
	path: '/obs/tutorial/ai-assistant',
	pages: [
		{
			title: 'What it does',
			blocks: [
				{ type: 'text', text: 'Connect an AI app like **Claude** to Froggi and it sees your running app: overlays, OBS, flows and logs. Then ask in plain words:' },
				{ type: 'list', items: ['*"Build me an Ultimate-style HUD for a 4:3 game window."*', '*"Make a flow that flashes my lights when I lose my last stock."*', '*"Set up stage striking for a doubles set."*', '*"Add my overlay to OBS."*'] },
				{ type: 'text', text: 'It explains first and changes things when you ask.' },
			],
		},
		{
			title: 'Turn it on',
			blocks: [
				{ type: 'text', text: 'Go to **Settings** → **AI Assistant (MCP)**:' },
				{ type: 'list', items: ['**Read & explain**: status, logs, settings and how-tos. Start here.', '**Allow edits**: it can also build and change overlays, flows and OBS automation.'] },
				{ type: 'note', text: 'Switch either off any time; it takes effect on the assistant\'s next step. Froggi stays on your computer; what you type goes to your AI app\'s provider, like any chat.' },
			],
		},
		{
			title: 'Connect your AI app',
			blocks: [
				{ type: 'text', text: 'Under **Connect an AI app**, pick your app and press its button:' },
				{ type: 'list', items: ['**Claude Desktop** — **Add to Claude Desktop** hands Claude the **Froggi extension**, a `.mcpb` file. Click **Install** in Claude.', '**Claude Code** — copies a command. Run it in a terminal, then type `/mcp` in Claude Code.', '**Cursor** / **VS Code** — opens the app and asks to add Froggi.', '**Other app** — copies the server address for any app that supports MCP.'] },
				{ type: 'heading', text: 'What is the .mcpb file?' },
				{ type: 'text', text: 'An **MCP Bundle** — a small extension Claude Desktop installs in one click. It contains no copy of Froggi: it passes Claude\'s questions to Froggi on this computer. If Froggi is closed it tells Claude so, and reconnects when Froggi starts. If Claude doesn\'t open it by itself, Froggi shows you the file — double-click it with Claude Desktop open.' },
				{ type: 'note', text: '**AI app on another device?** With Tailscale set up, **Advanced → Expose over Tailscale** gives a private HTTPS address only your own devices can reach.' },
			],
		},
		{
			title: 'Instructions for your AI',
			blocks: [
				{ type: 'text', text: 'Connected apps get Froggi\'s instructions automatically. Some apps drop them — and they\'re handy in a **Claude project** or your app\'s **custom instructions** too. Copy them and paste them there:' },
				{ type: 'copyInstructions' },
				{ type: 'list', items: ['show you where to click first, and only change things when you ask', 'ask for the aspect ratio before building an overlay, and show you a preview', 'ask before deleting — and never delete anything for good', 'never ask for passwords, tokens or connect codes in chat'] },
			],
		},
		{
			title: 'Getting good results',
			blocks: [
				{ type: 'text', text: 'Talk to it like a co-streamer who knows Froggi. Things to try:' },
				{ type: 'list', items: ['"Build a 16:9 HUD for my Melee stream that **replaces the game HUD** — names, percent and stocks along the bottom."', '"Make my post-game scene show the **set score and both players\' damage dealt**."', '"When I lose my **last stock**, switch OBS to my **close-up camera** for 5 seconds."', '"Post the **set score to my server** after every game" — it builds the flow; you paste the URL and token in the editor.', '"Why is my overlay **blank in OBS**?" — it checks the connection, the scene and Froggi\'s logs.'] },
				{ type: 'heading', text: 'Iterate in small steps' },
				{ type: 'text', text: 'Keep the **preview** open next to the chat (Claude shows it in the conversation; other apps give you a link to the editor) and adjust one thing at a time: "bigger percent", "move the stocks under the name", "use the Ultimate font". It checks each change with a screenshot from your own replays, and every change can be undone.' },
				{ type: 'note', text: 'It explains first and only changes things when you ask. It never deletes anything for good, and never asks for passwords, tokens or connect codes in chat.' },
			],
		},
	],
};
