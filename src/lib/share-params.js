/**
 * Shareable result links (SolutionsNepal)
 * =================================
 * Lets any calculator encode its inputs in the URL (?p=500000&rate=8…),
 * restore them on load, and offer a "Copy result link" button — so a
 * result can be shared on Viber, Messenger or Facebook and reopened
 * with the exact same inputs. No backend, no storage, no tracking.
 *
 * Adoption per page (3 steps):
 *   1. import { readSharedParams, syncUrl, copyLink } from '…/share-params.js';
 *   2. const PARAMS = { p: 'my-amount-input-id', … };  // param → element id
 *   3. readSharedParams(PARAMS, location.search) before first calc;
 *      syncUrl(PARAMS) whenever inputs change; copyLink() on button click.
 *
 * @module share-params
 */

/**
 * Encode an object as a query string, skipping empty values.
 * @param {Record<string, unknown>} obj
 * @returns {string} e.g. "p=500000&rate=8"
 */
export function encodeParams(obj) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === '' || v === null || v === undefined) continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

/**
 * Decode a query string into a plain object (values stay strings —
 * the page validates/converts them with its own logic).
 * @param {string} search  with or without leading "?"
 * @returns {Record<string, string>}
 */
export function decodeParams(search) {
  const out = {};
  if (!search) return out;
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  sp.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

/**
 * Apply shared params to page inputs. Unknown params and missing
 * elements are ignored; checkbox inputs use "1"/"0".
 * @param {Record<string, string>} keys  param → element id
 * @param {string} search  location.search
 * @returns {Record<string, string>} params that were actually applied
 */
export function readSharedParams(keys, search) {
  const params = decodeParams(search);
  const applied = {};
  for (const [param, id] of Object.entries(keys)) {
    if (!(param in params)) continue;
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = params[param] === '1';
    else el.value = params[param];
    applied[param] = params[param];
  }
  return applied;
}

/** Read current input values into a params object. */
export function currentParams(keys) {
  const obj = {};
  for (const [param, id] of Object.entries(keys)) {
    const el = document.getElementById(id);
    if (!el) continue;
    obj[param] = el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value;
  }
  return obj;
}

/**
 * Replace the address-bar URL with the current inputs (no reload,
 * no history spam) so the visible link always reproduces the result.
 */
export function syncUrl(keys) {
  const qs = encodeParams(currentParams(keys));
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

/**
 * Copy text (defaults to the current URL) with a legacy fallback
 * for browsers without async clipboard permission.
 * @returns {Promise<boolean>} whether the copy succeeded
 */
export async function copyLink(fallbackText) {
  const text = fallbackText ?? location.href;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
