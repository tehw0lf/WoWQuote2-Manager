export function parseLua(src) {
  const result = { entries: [], categories: [] };

  // WQcategories_data
  const catMatch = src.match(/WQcategories_data\s*=\s*\{([\s\S]*?)\};/);
  if (catMatch) {
    const catPattern = /\{([^}]*)\}/g;
    let m;
    while ((m = catPattern.exec(catMatch[1])) !== null) {
      const inner = m[1];
      const cat = {};
      const kvPattern = /(\w+)\s*=\s*"([^"]*)"/g;
      let kv;
      let hasKV = false;
      while ((kv = kvPattern.exec(inner)) !== null) {
        cat[kv[1]] = kv[2];
        hasKV = true;
      }
      if (!hasKV) {
        const plain = inner.match(/"([^"]*)"/);
        if (plain) cat.en = plain[1];
      }
      if (cat.en) result.categories.push(cat);
    }
  }

  // WQmedia_data — stack-based brace matching
  const mediaMatch = src.match(/WQmedia_data\s*=\s*\{([\s\S]*)\};?\s*$/);
  if (mediaMatch) {
    const block = mediaMatch[1];
    let depth = 0, start = -1;
    for (let i = 0; i < block.length; i++) {
      if (block[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (block[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          const entry = parseEntry(block.slice(start + 1, i));
          if (entry) result.entries.push(entry);
          start = -1;
        }
      }
    }
  }

  return result;
}

const FIELD_PATTERNS = {
  id: /id\s*=\s*"([^"]*)"/,
  file: /file\s*=\s*"([^"]*)"/,
  msg: /msg\s*=\s*"([^"]*)"/,
  len: /len\s*=\s*([\d.]+)/,
  cat: /cat\s*=\s*([\d.]+)/,
};

function parseEntry(block) {
  const str = (key) => { const m = block.match(FIELD_PATTERNS[key]); return m ? m[1] : null; };
  const num = (key) => { const m = block.match(FIELD_PATTERNS[key]); return m ? parseFloat(m[1]) : 0; };
  const id = str('id');
  const file = str('file');
  if (!id || !file) return null;
  return { id, file, len: num('len'), msg: str('msg') || '', cat: num('cat') || 1 };
}
