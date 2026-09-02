import { randomUUID, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import type { OAuthServerProvider, AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { OAuthClientInformationFull, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';

/**
 * Minimal OAuth 2.1 provider so Claude Desktop's "Add connector" UI (which insists on the MCP
 * Authorization flow — dynamic client registration + auth code + token) can connect to Froggi's
 * loopback MCP. Everything lives in memory and the authorization step AUTO-APPROVES: the real trust
 * boundary is the loopback bind (and, when exposed, the user's own tailnet), not this handshake —
 * there is no separate user/account to authenticate against. The config-file/mcp-remote path stays
 * usable because the MCP endpoint does not *require* a token; these endpoints only exist so the
 * connector's mandatory OAuth dance succeeds.
 */
const rand = () => randomBytes(24).toString('base64url');

type StoredCode = { clientId: string; codeChallenge: string; redirectUri: string; resource?: string; expiresAt: number };

export class FroggiOAuthProvider implements OAuthServerProvider {
	private clients = new Map<string, OAuthClientInformationFull>();
	private codes = new Map<string, StoredCode>();
	private tokens = new Map<string, AuthInfo>();

	clientsStore: OAuthRegisteredClientsStore = {
		getClient: (id) => this.clients.get(id),
		registerClient: (client) => {
			const full = {
				...client,
				client_id: randomUUID(),
				client_id_issued_at: Math.floor(Date.now() / 1000),
			} as OAuthClientInformationFull;
			this.clients.set(full.client_id, full);
			return full;
		},
	};

	// Auto-approve: issue a code immediately and redirect back. No consent UI (own-machine loopback).
	async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
		const code = rand();
		this.codes.set(code, {
			clientId: client.client_id,
			codeChallenge: params.codeChallenge,
			redirectUri: params.redirectUri,
			resource: params.resource?.href,
			expiresAt: Date.now() + 5 * 60_000,
		});
		const url = new URL(params.redirectUri);
		url.searchParams.set('code', code);
		if (params.state) url.searchParams.set('state', params.state);
		res.redirect(url.href);
	}

	async challengeForAuthorizationCode(_client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
		const entry = this.codes.get(authorizationCode);
		if (!entry || entry.expiresAt < Date.now()) throw new Error('Invalid or expired authorization code');
		return entry.codeChallenge;
	}

	async exchangeAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<OAuthTokens> {
		const entry = this.codes.get(authorizationCode);
		if (!entry || entry.clientId !== client.client_id || entry.expiresAt < Date.now()) {
			throw new Error('Invalid or expired authorization code');
		}
		this.codes.delete(authorizationCode);
		return this.issueTokens(client.client_id, entry.resource);
	}

	async exchangeRefreshToken(client: OAuthClientInformationFull, _refreshToken: string, _scopes?: string[], resource?: URL): Promise<OAuthTokens> {
		return this.issueTokens(client.client_id, resource?.href);
	}

	async verifyAccessToken(token: string): Promise<AuthInfo> {
		const info = this.tokens.get(token);
		if (!info || (info.expiresAt ?? 0) < Math.floor(Date.now() / 1000)) throw new Error('Invalid or expired token');
		return info;
	}

	private issueTokens(clientId: string, resource?: string): OAuthTokens {
		const access = rand();
		const expiresAt = Math.floor(Date.now() / 1000) + 3600;
		this.tokens.set(access, { token: access, clientId, scopes: [], expiresAt, resource: resource ? new URL(resource) : undefined });
		return { access_token: access, token_type: 'Bearer', expires_in: 3600, refresh_token: rand(), scope: '' };
	}
}
