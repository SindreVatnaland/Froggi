import type { Tutorial } from './types';

export const integrateObsTutorial: Tutorial = {
	id: 'integrate-obs',
	title: 'Integrate with OBS',
	description: 'Connect OBS and add your overlays to your stream.',
	icon: 'Plug',
	path: '/obs/tutorial/integrate-obs',
	pages: [
		{
			title: 'What it gives you',
			blocks: [
				{ type: 'text', text: 'With OBS connected, Froggi and OBS work as one:' },
				{ type: 'list', items: ['**Overlays in one click**: Froggi adds them to your OBS scene at the right size.', '**OBS follows the game**: your game scene when a game starts, a camera scene when it ends.', '**OBS on the Dashboard**: scenes, sources, volume and the replay buffer, also from your phone.'] },
				{ type: 'image', src: '/image/tutorial/integrate-obs/obs-live-preview.png', caption: 'A Froggi overlay live in OBS.' },
				{ type: 'image', src: '/image/tutorial/obs/stream-hub.jpg', caption: 'Stream: everything for your stream in one place.' },
			],
		},
		{
			title: 'Connect OBS',
			blocks: [
				{ type: 'text', text: 'Open **OBS Studio**, then in Froggi go to **Stream** → **OBS Connection** and click **⚙ Set up OBS automatically**. Froggi turns on OBS\'s WebSocket server for you — if OBS asks, restart it and Froggi connects by itself.' },
				{ type: 'image', src: '/image/tutorial/obs/obs-connection.jpg', caption: 'Stream → OBS Connection: status, one-click setup and the WebSocket address.' },
				{ type: 'text', text: 'Connected? The status turns green, and so does the border of the OBS icon in the sidebar.' },
				{ type: 'heading', text: 'Didn\'t connect? Do it by hand' },
				{ type: 'list', ordered: true, items: ['In OBS open **Tools** → **WebSocket Server Settings**.', 'Tick **Enable WebSocket server**. Note the **Server Port** (usually 4455) and, if authentication is on, the password (**Show Connect Info**).', 'In Froggi, under **WebSocket** on the OBS Connection page, enter the IP address (`localhost` when OBS runs on this computer), the port and the password, then click **Connect**.'] },
				{ type: 'image', src: '/image/tutorial/integrate-obs/enable-websocket-server.png', caption: 'OBS → Tools → WebSocket Server Settings.' },
				{ type: 'note', text: 'The same steps connect Froggi to **OBS on another computer** on your network — use that computer\'s IP address.' },
			],
		},
		{
			title: 'Add an overlay',
			blocks: [
				{ type: 'list', ordered: true, items: ['Go to **Stream** → **Overlays** and open your overlay.', 'Click **Embed** → **Add to OBS**: it lands in your current OBS scene as a browser source, sized right.', 'Not connected? Copy the **local URL** and add a **Browser** source in OBS with it.'] },
				{ type: 'image', src: '/image/tutorial/integrate-obs/obs-scene-preview.png', caption: 'The overlay as a Browser source in OBS.' },
			],
		},
		{
			title: 'Check it',
			blocks: [
				{ type: 'text', text: 'The editor shows placeholder data, so OBS can look different until a game runs. To check without playing, press **▶ Run replay** in the overlay editor: Froggi plays your latest replay through every scene (Menu → In Game → Post Game).' },
				{ type: 'text', text: 'Next: the [Remote control OBS](/obs/tutorial/remote-obs) tutorial makes OBS switch scenes by itself and lets you run it from your phone.' },
			],
		},
	],
};
