/**
 * "Sign in with OpenRouter": OAuth PKCE with no client secret and no backend
 * (openrouter.ai/docs/guides/overview/auth/oauth). The user approves on
 * openrouter.ai, comes back with `?code=`, and the code plus our verifier is
 * exchanged for a key that belongs to the user (they control and pay for it).
 */
const VERIFIER = 'na:ai:pkce'

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** Where OpenRouter sends the user back: this page, without query or hash. */
const callbackUrl = () => location.origin + location.pathname

export async function startOpenRouterLogin() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)))
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  sessionStorage.setItem(VERIFIER, verifier)
  const u = new URL('https://openrouter.ai/auth')
  u.searchParams.set('callback_url', callbackUrl())
  u.searchParams.set('code_challenge', challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  location.assign(u.toString())
}

/**
 * On load: if we are coming back from OpenRouter, trade the code for a key.
 * The code is removed from the address bar either way.
 */
export async function finishOpenRouterLogin(): Promise<string | null> {
  const url = new URL(location.href)
  const code = url.searchParams.get('code')
  let verifier: string | null = null
  try {
    verifier = sessionStorage.getItem(VERIFIER)
  } catch {}
  if (!code || !verifier) return null
  url.searchParams.delete('code')
  history.replaceState(null, '', url.toString())
  sessionStorage.removeItem(VERIFIER)
  const res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  })
  if (!res.ok) throw new Error(`OpenRouter: ${res.status}`)
  const body = await res.json()
  return typeof body.key === 'string' ? body.key : null
}
