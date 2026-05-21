<h1 class="text-2xl font-semibold">Authentication</h1>

<h2>
	Every request Froggi sends includes an <code>Authorization</code> header. There are two auth
	modes:
</h2>

<div class="auth-card">
	<p class="auth-title">Bearer Token</p>
	<p class="auth-body">
		A static secret you generate and paste in. Froggi sends it as-is on every request.
	</p>
	<pre class="code-block">Authorization: Bearer &lt;your-token&gt;</pre>
	<p class="auth-hint">
		Use this for simple setups — a self-hosted server, a webhook proxy, or any service that accepts
		a fixed token.
	</p>
</div>

<div class="auth-card">
	<p class="auth-title">OAuth2 · Client Credentials</p>
	<p class="auth-body">
		Froggi fetches a short-lived access token from your auth server before sending events. It
		re-fetches automatically when the token is about to expire.
	</p>
	<pre class="code-block">POST &lt;Login URL&gt;
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=&lt;Client ID&gt;
&client_secret=&lt;Client Secret&gt;</pre>
	<p class="auth-hint">
		Use this when your endpoint is protected by an identity provider such as Keycloak, Auth0, or a
		custom OAuth2 server.
	</p>
</div>

<h2>
	If your endpoint is on <b>localhost</b> and you only need basic protection, the Bearer Token mode
	with a hard-coded secret is the simplest option.
</h2>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}

	code {
		font-family: monospace;
		font-size: 0.8rem;
		opacity: 0.75;
	}

	.auth-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid rgba(128, 128, 128, 0.25);
		border-radius: 0.375rem;
		padding: 1rem;
		margin: 0.5rem 0;
	}

	.auth-title {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.5;
		color: var(--secondary-color);
	}

	.auth-body {
		font-size: 0.875rem;
		color: var(--secondary-color);
		opacity: 0.8;
		line-height: 1.5;
	}

	.auth-hint {
		font-size: 0.78rem;
		color: var(--secondary-color);
		opacity: 0.45;
		line-height: 1.5;
	}

	.code-block {
		font-family: monospace;
		font-size: 0.72rem;
		line-height: 1.6;
		opacity: 0.65;
		padding: 0.75rem;
		border-top: 1px solid rgba(128, 128, 128, 0.2);
		border-bottom: 1px solid rgba(128, 128, 128, 0.2);
		white-space: pre;
		overflow-x: auto;
		margin: 0.25rem 0;
		color: var(--secondary-color);
	}
</style>
