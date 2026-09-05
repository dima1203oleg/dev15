import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export type IdentityRuntimeStatus = 'NOT_CONFIGURED' | 'CONFIGURED';

export type IdentityRole =
  | 'USER'
  | 'PARTNER'
  | 'AMBASSADOR'
  | 'SUPPORT'
  | 'FINANCE_ADMIN'
  | 'RISK_ADMIN'
  | 'QUALITY_ADMIN'
  | 'CAMPAIGN_ADMIN'
  | 'CONTRACT_ADMIN'
  | 'ADMIN'
  | 'SUPER_ADMIN';

const allowedRoles = new Set<IdentityRole>([
  'USER', 'PARTNER', 'AMBASSADOR', 'SUPPORT', 'FINANCE_ADMIN', 'RISK_ADMIN',
  'QUALITY_ADMIN', 'CAMPAIGN_ADMIN', 'CONTRACT_ADMIN', 'ADMIN', 'SUPER_ADMIN'
]);

export interface IdentityPrincipal {
  subject: string;
  issuer: string;
  roles: readonly IdentityRole[];
  email?: string;
}

export interface IdentityVerifier {
  readonly status: () => IdentityRuntimeStatus;
  authenticate(authorizationHeader: unknown): Promise<IdentityPrincipal>;
  requireRole(principal: IdentityPrincipal, role: IdentityRole): void;
}

function configuredUrl(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`IDENTITY_NOT_CONFIGURED:${field}`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`INVALID_IDENTITY_URL:${field}`);
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error(`INVALID_IDENTITY_URL:${field}`);
  return parsed.toString().replace(/\/$/, '');
}

function readRoles(value: unknown): IdentityRole[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return [...new Set(values.filter((item): item is IdentityRole => typeof item === 'string' && allowedRoles.has(item as IdentityRole)))];
}

function unauthorized(): never {
  throw new Error('IDENTITY_UNAUTHORIZED');
}

/**
 * OIDC/JWKS verification boundary. The browser never verifies or invents
 * roles; the server accepts only a signature-valid token with matching issuer
 * and audience. No route should bypass this boundary for production data.
 */
export function createOidcIdentityVerifier(
  environment: NodeJS.ProcessEnv = process.env,
  keyResolver?: JWTVerifyGetKey
): IdentityVerifier {
  const issuerValue = (environment.IDENTITY_ISSUER_URL ?? '').trim();
  const audience = (environment.IDENTITY_AUDIENCE ?? '').trim();
  const jwksValue = (environment.IDENTITY_JWKS_URL ?? '').trim();
  const roleClaim = (environment.IDENTITY_ROLE_CLAIM ?? 'roles').trim() || 'roles';

  if (!issuerValue || !audience || !jwksValue) {
    return {
      status: () => 'NOT_CONFIGURED',
      async authenticate() { throw new Error('IDENTITY_NOT_CONFIGURED'); },
      requireRole() { throw new Error('IDENTITY_NOT_CONFIGURED'); }
    };
  }

  let issuer: string;
  let jwksUrl: string;
  try {
    issuer = configuredUrl(issuerValue, 'IDENTITY_ISSUER_URL');
    jwksUrl = configuredUrl(jwksValue, 'IDENTITY_JWKS_URL');
  } catch {
    return {
      status: () => 'NOT_CONFIGURED',
      async authenticate() { throw new Error('IDENTITY_NOT_CONFIGURED'); },
      requireRole() { throw new Error('IDENTITY_NOT_CONFIGURED'); }
    };
  }

  const resolver = keyResolver ?? createRemoteJWKSet(new URL(jwksUrl));
  return {
    status: () => 'CONFIGURED',
    async authenticate(authorizationHeader: unknown) {
      if (typeof authorizationHeader !== 'string' || !/^Bearer\s+\S+$/i.test(authorizationHeader)) return unauthorized();
      const token = authorizationHeader.replace(/^Bearer\s+/i, '').trim();
      if (token.length > 16_384) return unauthorized();
      try {
        const { payload } = await jwtVerify(token, resolver, {
          issuer,
          audience,
          algorithms: ['RS256', 'ES256']
        });
        if (typeof payload.sub !== 'string' || payload.sub.length === 0) return unauthorized();
        return {
          subject: payload.sub,
          issuer,
          roles: readRoles(payload[roleClaim]),
          email: typeof payload.email === 'string' ? payload.email : undefined
        };
      } catch {
        return unauthorized();
      }
    },
    requireRole(principal: IdentityPrincipal, role: IdentityRole) {
      if (!principal || !allowedRoles.has(role) || !principal.roles.includes(role)) throw new Error('IDENTITY_FORBIDDEN');
    }
  };
}
