'use client';

/**
 * Copy text to the clipboard.
 *
 * Browser notes:
 * - No special permission prompt is required for copying (unlike paste/read).
 * - Requires a secure context: HTTPS, localhost, or 127.0.0.1.
 *   Plain HTTP on a LAN IP (e.g. http://192.168.x.x) blocks navigator.clipboard.
 * - Must be triggered by a user action (click/keypress).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to legacy method */
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function isClipboardWriteSupported(): boolean {
  if (typeof window === 'undefined') return false;

  const secure =
    window.isSecureContext ||
    location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

  return secure || typeof document.execCommand === 'function';
}
