/**
 * Save a Blob to the user's disk, prompting the native "Save As" file picker
 * where the File System Access API is available (Chrome/Edge/Opera desktop),
 * so the user chooses the location and filename.
 *
 * Everywhere else (Firefox, Safari, iOS, Android) it falls back to the classic
 * hidden-anchor download and the browser decides the save location — the same
 * behavior these tools had before.
 *
 * @param {Blob}   blob     File content to save.
 * @param {string} filename Suggested name, e.g. 'solutionsnepal-qr.png'.
 * @returns {Promise<boolean>} true when saved through the picker, false when the fallback download was used.
 */
export async function saveFileAs(blob, filename) {
  // Bracket access keeps this readable in plain JS and avoids TS complaints
  // about the not-yet-universal API.
  const picker = typeof window !== 'undefined' ? window['showSaveFilePicker'] : undefined;
  // The picker needs a real user gesture: without transient activation it
  // aborts instantly (headless browsers, some webviews) and that AbortError
  // is indistinguishable from a user cancel — so skip it and use the
  // anchor download instead.
  const hasActivation = typeof navigator !== 'undefined'
    && (!('userActivation' in navigator) || navigator.userActivation?.isActive);

  if (typeof picker === 'function' && hasActivation) {
    try {
      const ext = (filename.match(/\.[^.]+$/) || [''])[0].toLowerCase();
      const accept = {};
      accept[blob.type || 'application/octet-stream'] = ext ? ['.' + ext.slice(1)] : undefined;

      const handle = await picker.call(window, {
        suggestedName: filename,
        types: ext
          ? [{ description: PICKER_TYPE_LABELS[ext] || ext.toUpperCase() + ' file', accept }]
          : undefined,
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      // User closed the picker without saving — respect that, do not force a download.
      if (err && err.name === 'AbortError') return true;
      // Any other failure (permission, security, …) → fall through to the anchor download.
    }
  }

  // Fallback: classic anchor download (previous behavior).
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return false;
}

const PICKER_TYPE_LABELS = {
  '.png': 'PNG image',
  '.jpg': 'JPEG image',
  '.jpeg': 'JPEG image',
  '.webp': 'WebP image',
  '.svg': 'SVG image',
  '.pdf': 'PDF document',
  '.zip': 'ZIP archive',
  '.docx': 'Word document',
};
