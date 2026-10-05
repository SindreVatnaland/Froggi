import { streamEmbedUrl } from '../../frontend/src/lib/utils/streamEmbed';

describe('streamEmbedUrl', () => {
	const host = 'localhost';
	it('twitch link, shorthand and bare username → muted Twitch player with parent', () => {
		const expected = 'https://player.twitch.tv/?channel=froggi&parent=localhost&muted=true';
		expect(streamEmbedUrl('https://www.twitch.tv/froggi', host)?.url).toBe(expected);
		expect(streamEmbedUrl('twitch.tv/froggi/videos', host)?.url).toBe(expected);
		expect(streamEmbedUrl('twitch:froggi', host)?.url).toBe(expected);
		expect(streamEmbedUrl('froggi', host)?.url).toBe(expected);
	});
	it('kick', () => {
		expect(streamEmbedUrl('https://kick.com/froggi', host)).toEqual({ platform: 'kick', url: 'https://player.kick.com/froggi?muted=true' });
		expect(streamEmbedUrl('kick:froggi', host)?.platform).toBe('kick');
	});
	it('youtube watch, live and short links', () => {
		const url = 'https://www.youtube.com/embed/abc123XYZ_-?autoplay=1&mute=1';
		expect(streamEmbedUrl('https://www.youtube.com/watch?v=abc123XYZ_-', host)?.url).toBe(url);
		expect(streamEmbedUrl('https://youtube.com/live/abc123XYZ_-?si=x', host)?.url).toBe(url);
		expect(streamEmbedUrl('https://youtu.be/abc123XYZ_-', host)?.url).toBe(url);
	});
	it('other URLs are embedded as-is; empty input → nothing', () => {
		expect(streamEmbedUrl('https://example.com/player', host)).toEqual({ platform: 'url', url: 'https://example.com/player' });
		expect(streamEmbedUrl('  ', host)).toBeUndefined();
	});
});
