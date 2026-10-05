/**
 * Turn what a user types for "stream preview" into an embeddable player URL.
 * Accepts a stream link (twitch.tv/x, kick.com/x, youtube watch / live / youtu.be links), a
 * "platform:username" shorthand (twitch:x, kick:x), a bare Twitch username, or any other URL
 * (embedded as-is). Players start muted. Twitch requires `parent` = the embedding page's hostname.
 */
export type StreamEmbed = { platform: 'twitch' | 'kick' | 'youtube' | 'url'; url: string };

const twitch = (channel: string, parent: string): StreamEmbed => ({
	platform: 'twitch',
	url: `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&muted=true`,
});
const kick = (channel: string): StreamEmbed => ({ platform: 'kick', url: `https://player.kick.com/${encodeURIComponent(channel)}?muted=true` });
const youtube = (videoId: string): StreamEmbed => ({ platform: 'youtube', url: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1` });

export function streamEmbedUrl(input: string, parentHost: string): StreamEmbed | undefined {
	const value = input.trim();
	if (!value) return undefined;

	const short = value.match(/^(twitch|kick):\s*([\w-]+)$/i);
	if (short) return short[1].toLowerCase() === 'twitch' ? twitch(short[2], parentHost) : kick(short[2]);
	if (/^[a-z0-9_]{3,25}$/i.test(value)) return twitch(value, parentHost); // bare Twitch username

	let url: URL;
	try {
		url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
	} catch {
		return undefined;
	}
	const host = url.hostname.replace(/^(www\.|m\.)/, '');
	const first = url.pathname.split('/').filter(Boolean)[0];

	if (host === 'twitch.tv' && first) return twitch(first, parentHost);
	if (host === 'kick.com' && first) return kick(first);
	if (host === 'youtu.be' && first) return youtube(first);
	if (host === 'youtube.com') {
		const id = url.searchParams.get('v') ?? (first === 'live' || first === 'embed' ? url.pathname.split('/')[2] : undefined);
		if (id) return youtube(id);
	}
	return { platform: 'url', url: url.toString() };
}
