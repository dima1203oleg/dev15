import assert from 'node:assert/strict';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createOidcIdentityVerifier } from '../src/server/identityBoundary';

const notConfigured = createOidcIdentityVerifier({} as NodeJS.ProcessEnv);
assert.equal(notConfigured.status(), 'NOT_CONFIGURED');
await assert.rejects(() => notConfigured.authenticate('Bearer token'), /IDENTITY_NOT_CONFIGURED/);

const issuer = 'https://identity.example.test';
const { privateKey, publicKey } = await generateKeyPair('RS256');
const publicJwk = await exportJWK(publicKey);
publicJwk.kid = 'siren-test-key';
publicJwk.alg = 'RS256';
const verifier = createOidcIdentityVerifier({
  IDENTITY_ISSUER_URL: issuer,
  IDENTITY_AUDIENCE: 'siren-api',
  IDENTITY_JWKS_URL: `${issuer}/.well-known/jwks.json`,
  IDENTITY_ROLE_CLAIM: 'roles'
} as NodeJS.ProcessEnv, createLocalJWKSet({ keys: [publicJwk] }));
assert.equal(verifier.status(), 'CONFIGURED');

const token = await new SignJWT({ roles: ['PARTNER', 'UNTRUSTED_ROLE'], email: 'partner@example.test' })
  .setProtectedHeader({ alg: 'RS256', kid: 'siren-test-key' })
  .setIssuer(issuer)
  .setAudience('siren-api')
  .setSubject('user-123')
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(privateKey);
const principal = await verifier.authenticate(`Bearer ${token}`);
assert.deepEqual(principal.roles, ['PARTNER']);
assert.equal(principal.subject, 'user-123');
assert.equal(principal.email, 'partner@example.test');
verifier.requireRole(principal, 'PARTNER');
assert.throws(() => verifier.requireRole(principal, 'FINANCE_ADMIN'), /IDENTITY_FORBIDDEN/);
const tokenParts = token.split('.');
tokenParts[2] = `${tokenParts[2]!.startsWith('A') ? 'B' : 'A'}${tokenParts[2]!.slice(1)}`;
await assert.rejects(() => verifier.authenticate(`Bearer ${tokenParts.join('.')}`), /IDENTITY_UNAUTHORIZED/);
await assert.rejects(() => verifier.authenticate('Basic not-a-bearer'), /IDENTITY_UNAUTHORIZED/);

console.log('Identity acceptance tests: PASS');
