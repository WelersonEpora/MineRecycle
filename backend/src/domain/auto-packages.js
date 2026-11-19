"use strict";

const { AUTO_PACKAGE_SOURCES } = require("./constants");

// Pacotes automáticos (decisão de 2026-11-19): um pacote por valor de cada coluna de agrupamento da planilha de lotes
// (sistema vinculado, família comercial, subfamília). A cada importação, os lotes desses pacotes são recalculados a
// partir das colunas; nome, descrição e fotos do pacote são do vendedor e não mudam. Regra pura.
//
// O vendedor não mexe nos lotes de um pacote automático (a planilha manda). Pacote cujo valor sumiu da planilha fica
// vazio, mas não é apagado (guarda descrição, fotos e pedidos).

// Espaços repetidos viram um, sem espaço nas pontas. Vazio = null.
function cleanGroupValue(value) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

// Chave de comparação: "Cables", "cables" e " CABLES " são o mesmo pacote (o banco garante o mesmo, por lower()).
function groupKey(value) {
  const clean = cleanGroupValue(value);
  return clean ? clean.toLowerCase() : null;
}

// Ordem natural dos números de lote ("2" antes de "10", "10A" depois de "10").
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
function compareLotNumbers(a, b) {
  return collator.compare(String(a), String(b));
}

// lots = [{ lotNumber, linkedSystem, commercialFamily, subfamily, withdrawn }]: a lista de lotes depois da importação.
// packages = [{ id, source, sourceValue, lotNumbers: [] }]: os pacotes automáticos existentes.
// -> { create: [{ source, sourceValue, lotNumbers }], update: [{ packageId, source, sourceValue, add, remove,
//      lotNumbers }], emptied: [{ packageId, source, sourceValue }], unchanged: n }
function planAutoPackages(lots, packages) {
  const sorted = lots.filter((l) => !l.withdrawn).sort((a, b) => compareLotNumbers(a.lotNumber, b.lotNumber));

  // Grupos que a planilha forma: source -> key -> { sourceValue, lotNumbers }.
  const groups = new Map(AUTO_PACKAGE_SOURCES.map((s) => [s.source, new Map()]));
  for (const lot of sorted) {
    for (const { source, field } of AUTO_PACKAGE_SOURCES) {
      const key = groupKey(lot[field]);
      if (!key) continue;
      const bySource = groups.get(source);
      if (!bySource.has(key)) bySource.set(key, { sourceValue: cleanGroupValue(lot[field]), lotNumbers: [] });
      bySource.get(key).lotNumbers.push(lot.lotNumber);
    }
  }

  const update = [];
  const emptied = [];
  let unchanged = 0;
  const seen = new Set();
  for (const pkg of packages) {
    const group = groups.get(pkg.source)?.get(groupKey(pkg.sourceValue));
    seen.add(`${pkg.source}\u0000${groupKey(pkg.sourceValue)}`);
    const target = group ? group.lotNumbers : [];
    const before = new Set(pkg.lotNumbers);
    const after = new Set(target);
    const add = target.filter((n) => !before.has(n));
    const remove = pkg.lotNumbers.filter((n) => !after.has(n)).sort(compareLotNumbers);
    if (add.length === 0 && remove.length === 0) {
      unchanged += 1;
      continue;
    }
    update.push({ packageId: pkg.id, source: pkg.source, sourceValue: pkg.sourceValue, add, remove, lotNumbers: target });
    if (target.length === 0) emptied.push({ packageId: pkg.id, source: pkg.source, sourceValue: pkg.sourceValue });
  }

  const create = [];
  for (const { source } of AUTO_PACKAGE_SOURCES) {
    const entries = [...groups.get(source).entries()].sort((a, b) => collator.compare(a[1].sourceValue, b[1].sourceValue));
    for (const [key, group] of entries) {
      if (seen.has(`${source}\u0000${key}`)) continue;
      create.push({ source, sourceValue: group.sourceValue, lotNumbers: group.lotNumbers });
    }
  }

  return { create, update, emptied, unchanged };
}

module.exports = { planAutoPackages, cleanGroupValue, groupKey, compareLotNumbers };
