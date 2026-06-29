const LOCALES = ['en', 'de', 'fr', 'nl', 'es', 'pt'];

const LOCALE_GUARDS = {
  de: 'if GetLocale() ~= "deDE" then return end',
  fr: 'if GetLocale() ~= "frFR" then return end',
  nl: 'if GetLocale() ~= "nlNL" then return end',
  es: 'local locale = GetLocale()\nif locale ~= "esES" and locale ~= "esMX" then return end',
  pt: 'if GetLocale() ~= "ptBR" then return end',
};

const LOCALE_CHANNELS = {
  en: { s: 'Say',          p: 'Party',  r: 'Raid',  g: 'Guild',      o: 'Officer' },
  de: { s: 'Umgebung',     p: 'Gruppe', r: 'Raid',  g: 'Gilde',      o: 'Offiziere' },
  fr: { s: 'Conversation', p: 'Groupe', r: 'Raid',  g: 'Guilde',     o: 'Officiers' },
  nl: { s: 'Zeggen',       p: 'Groep',  r: 'Raid',  g: 'Gilde',      o: 'Officieren' },
  es: { s: 'Decir',        p: 'Grupo',  r: 'Banda', g: 'Hermandad',  o: 'Oficiales' },
  pt: { s: 'Dizer',        p: 'Grupo',  r: 'Raide', g: 'Guilda',     o: 'Oficiais' },
};

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getPrefix(id) {
  const m = id.match(/^([^:]+):/);
  return m ? m[1] : 'default';
}

export function serializeMediaData(entries, categories) {
  let out = '-- Private media data. DO NOT COMMIT.\n';
  out += '-- Format: same as WQmedia entries in Media.lua\n';
  out += '-- Categories are defined in WQcategories below.\n\n';

  out += 'WQcategories_data = {\n';
  for (const cat of categories) {
    const parts = LOCALES.filter(l => cat[l]).map(l => `${l} = "${esc(cat[l])}"`);
    out += `    { ${parts.join(', ')} },\n`;
  }
  out += '};\n\n';

  out += 'WQmedia_data = {\n';
  const byPrefix = {};
  const prefixOrder = [];
  for (const e of entries) {
    const prefix = getPrefix(e.id);
    if (!byPrefix[prefix]) { byPrefix[prefix] = []; prefixOrder.push(prefix); }
    byPrefix[prefix].push(e);
  }
  for (const prefix of prefixOrder) {
    out += `-- begin of ${prefix} media data\n`;
    for (const e of byPrefix[prefix]) {
      out += `{   id = "${esc(e.id)}",\n    file = "${esc(e.file)}",\n    len = ${e.len},\n    msg = "${esc(e.msg)}",\n    cat = ${e.cat}\n},\n`;
    }
    out += `    -- end of ${prefix} media data\n`;
  }
  out += '};\n';
  return out;
}

export function serializeMediaLua(entries) {
  let out = 'WQmedia = {\n';
  for (const e of entries) {
    out += `{   id = "${esc(e.id)}",\n    file = "${esc(e.file)}",\n    len = ${e.len},\n    msg = "${esc(e.msg)}",\n    cat = ${e.cat}\n},\n`;
  }
  out += '};\n';
  return out;
}

// Patch an existing Localization.*.lua — replace only the WQcategories block.
export function patchLocalization(source, lang, categories) {
  const catLines = categories.map(cat => `    "${esc(cat[lang] || cat.en || '')}",`).join('\n');
  const replacement = `WQcategories = {\n${catLines}\n};`;
  // Replace WQcategories = { ... }; — handles "-- generated at build time" placeholder too
  const patched = source.replace(/WQcategories\s*=\s*\{[^}]*\};/s, replacement);
  // If the pattern wasn't found (shouldn't happen), just return the replacement appended
  if (patched === source) return replacement + '\n\n' + source;
  return patched;
}

export { LOCALES };
