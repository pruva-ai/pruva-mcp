/**
 * OAuth 2.0 Protected Resource Metadata endpoint (RFC 9728).
 *
 * Returns JSON metadata pointing clients at the authorization server they
 * should use to obtain a Bearer token for this MCP endpoint. Used in concert
 * with the `WWW-Authenticate: Bearer resource_metadata="..."` header emitted
 * by the protected `/api/mcp` route on a 401 response.
 *
 * The `resource` value is derived from the public-facing host of the request,
 * so it works both locally (http://localhost:3100) and behind the Vercel
 * proxy (https://mcp.pruva.ai). The authorization server is the Pruva backend
 * which already runs the device-code + token endpoints under `/api/oauth/*`.
 */

import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from "mcp-handler";

const DEFAULT_AUTH_SERVER = "https://www.pruva.ai";
const authServerUrl = process.env.PRUVA_API_URL ?? DEFAULT_AUTH_SERVER;

const handler = protectedResourceHandler({
  authServerUrls: [authServerUrl],
});

const optionsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, optionsHandler as OPTIONS };
