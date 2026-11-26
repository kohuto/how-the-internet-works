/* Shared file list and preview for web server inspectors. */
(() => {
  'use strict';
  const {esc}=globalThis.InternetLab;
  function serverStorage(server,host,{preview='',help}={}) {
    const file=server.files['index.html'],page=file.content;
    return `<section class="server-storage" aria-label="Úložiště webového serveru"><div class="section-label">ULOŽENÉ SOUBORY</div><div class="server-folder"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h7l2 2h9v12H3Z"/></svg><span>${esc(host)}</span></div><details class="server-file" data-detail-key="${esc(host)}-file"><summary><svg class="server-file-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8M8 16h8"/></svg><span class="server-file-name"><strong>${esc(file.name)}</strong><small>Webová stránka</small></span><span class="server-file-open">Otevřít</span><span class="server-file-chevron" aria-hidden="true">⌄</span></summary><div class="server-file-content"><div class="server-file-caption">NÁHLED SOUBORU · ${esc(file.name)}</div><article class="server-library-preview" aria-label="Náhled uložené stránky ${esc(host)}"><div class="server-library-brand">${esc(page.brand)}</div><div class="browser-library-home"><p class="library-kicker">${esc(page.kicker)}</p><h3 class="library-title">${esc(page.title)}</h3><p>${esc(page.description)}</p>${preview}</div></article></div></details></section><p class="hint" data-device-help="Uložená stránka">Soubor index.html je uložený na tomto webovém serveru. ${help?esc(help):host==='knihovna.test'?'Když prohlížeč požádá o stránku knihovna.test, server z něj připraví odpověď a pošle ji po síti. Prohlížeč zobrazí doručenou kopii.':'Tento server představuje dalšího zákazníka hostingu. Web knihovny je uložený na sousedním webovém serveru.'}</p>`;
  }
  Object.assign(globalThis.InternetLab,{serverStorage});
})();
