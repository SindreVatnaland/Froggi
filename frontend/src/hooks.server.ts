import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname.includes('undefined')) {
		console.error('[hooks] BAD REQUEST — pathname contains "undefined":', {
			pathname,
			referer: event.request.headers.get('referer'),
			origin: event.request.headers.get('origin'),
		});
	}
	return resolve(event);
};

export const handleError: HandleServerError = ({ error, event }) => {
	console.error('[hooks] Server error on', event.url.pathname, error);
};
