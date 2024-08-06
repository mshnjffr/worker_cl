/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname.split('/');
		if (path[1] === 'secure' && !path[2]) {
			// /secure endpoint
			return await handleSecureRequest(request);
		} else if (path[1] === 'secure' && path[2]) {
			// /secure/${COUNTRY} endpoint
			const country = path[2];
			return await handleCountryRequest(request, env, country);
		} else {
			return new Response('Not Found', { status: 404 });
		}
	},
};

async function handleSecureRequest(request) {
	console.log(request.headers);
	const email = request.headers.get('cf-access-authenticated-user-email') || 'unknown@example.com';
	const timestamp = new Date().toISOString();
	const country = request.headers.get('cf-ipcountry') || 'Unknown';

	const html = `
	  <html>
	  <body>
		${email} authenticated at ${timestamp} from 
		<a href="/secure/${country}">${country}</a>
	  </body>
	  </html>
	`;

	return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

async function handleCountryRequest(request, env, country) {
	const objectKey = `${country}.png`;
	const r2Response = await env.MY_BUCKET.get(objectKey);
	if (!r2Response) {
		return new Response('Flag not found', { status: 404 });
	}
	return new Response(r2Response.body, { headers: { 'Content-Type': 'image/png' } });
}
