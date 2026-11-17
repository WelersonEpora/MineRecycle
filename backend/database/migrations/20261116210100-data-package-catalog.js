"use strict";

// Dados: cadastro dos pacotes de venda (levantamento no STOR e planilha de estratégia, 2026-11-16).
// Roda uma vez por banco (sequelize_meta), no deploy, como qualquer migration. Sem preço, valor ou comprador.
//
// Chave estável: stor_folder (nome da pasta no STOR, grafia original). Pacote antigo sem stor_folder é reconhecido pelo
// nome igual ao da pasta (ou a um nome anterior conhecido, em `aliases`).
//
// Não sobrescreve o que o vendedor editou:
// - pacote que não existe: é criado (próximo número de catálogo livre; situação `status`, padrão rascunho);
// - pacote que existe: só preenche o vazio ou troca um valor que ainda é o anterior conhecido (`prev*`);
//   o nome público só é gravado se o nome ainda for o da pasta (ou um alias); documentos STOR só são acrescentados.
// - nunca mexe em situação, itens ou anexos de pacote existente.
//
// Locais: só com fonte em documento (ver docs/carga-de-dados.md). Números: IDs da planilha de estratégia; vazio quando
// o pacote não tem ID claro nela.

const C = "conceicao_do_araguaia";
const U = "uberaba";
const N = "niquelandia";
const BH = "belo_horizonte";
const S = "at_supplier";
const T = "to_be_confirmed";

const PACKAGES = [
  {
    folder: "1-6 Refractories – Conceição do Araguaia",
    aliases: ["1-6 Refractories"],
    name: "Refractories – Conceição do Araguaia",
    type: "bulk",
    locations: [C],
    prevLocations: [[C, U]],
    numbers: [1, 6],
    documents: ["1809438"],
    prevDocuments: ["1809439"] // o pacote antigo, antes da divisão, tinha os dois códigos
  },
  { folder: "1-6 Refractories – Porto Seco de Uberaba", name: "Refractories – Uberaba Dry Port", type: "bulk", locations: [U], numbers: [1, 6], documents: ["1809439"] },
  { folder: "7-8-11 Crushers", name: "Crushers", type: "equipment", locations: [T], numbers: [7, 8, 11] },
  { folder: "9-10-12 Dryer", name: "Rotary Dryer", type: "equipment", locations: [U, T], prevLocations: [[T]], numbers: [9, 10, 12] },
  { folder: "10-12-13 Kiln", name: "Rotary Kiln", type: "equipment", locations: [U, S, T], prevLocations: [[C, U, S]], numbers: [10, 12, 13] },
  { folder: "17-Laboratory", name: "Laboratory Equipment", type: "equipment", locations: [U], numbers: [17] },
  { folder: "19-30-Steel Structure", name: "Steel Structure", type: "bulk", locations: [T], prevLocations: [[C]], numbers: [19] },
  { folder: "20 Construction Materials_Rebar", name: "Construction Materials – Rebar", type: "bulk", locations: [T], numbers: [20], documents: ["1809548"] },
  {
    folder: "20 Construction Materials_tools and misc",
    name: "Construction Materials – Tools and Miscellaneous",
    type: "bulk",
    locations: [T],
    numbers: [20],
    documents: ["1809564"],
    pending: ["1809564"]
  },
  { folder: "24-LT 230kV", name: "230 kV Transmission Line", type: "bulk", locations: [T], numbers: [24], documents: ["1809565"], pending: ["1809565"] },
  { folder: "25-26 Electrical Substation Equipment", name: "Electrical Substation Equipment", type: "equipment", locations: [T], numbers: [25, 26] },
  { folder: "27-Electrical Cables", name: "Electrical Cables", type: "bulk", locations: [T], numbers: [27], documents: ["1809595"] },
  { folder: "27-Electrical Materials", name: "Electrical Materials", type: "bulk", locations: [T], numbers: [], documents: ["1809601"] },
  { folder: "28-Pipping", name: "Piping", type: "bulk", locations: [T], numbers: [28], documents: ["1809606"] },
  { folder: "29-Conveyors", name: "Belt Conveyors", type: "equipment", locations: [C], numbers: [29], documents: ["1809615"] },
  {
    folder: "30-Niquelândia",
    name: "Niquelândia Refinery Equipment",
    type: "equipment",
    locations: [N],
    numbers: [30],
    documents: ["1809007"],
    pending: ["1809007"]
  },
  { folder: "32-Compressed Air", name: "Compressed Air System", type: "equipment", locations: [T], numbers: [] },
  { folder: "32-ETE ETA", name: "Water and Effluent Treatment Plants", type: "equipment", locations: [T], numbers: [22] },
  { folder: "33-OTHER EQUIP", name: "Other Equipment", type: "equipment", locations: [T], numbers: [] },
  { folder: "Módulos Escritório", name: "Office Modules", type: "bulk", prevType: "equipment", locations: [C], numbers: [], documents: ["1809779"] },
  { folder: "TI e Escritório", name: "IT and Office Furniture", type: "bulk", prevType: "equipment", locations: [BH], numbers: [], documents: ["1809790"] },
  { folder: "Pick-Ups", name: "Pick-up Trucks", type: "equipment", locations: [T], numbers: [], status: "sold" }
];

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

async function findPackage(query, spec) {
  const [byFolder] = await query(`SELECT * FROM package WHERE stor_folder = $1`, [spec.folder]);
  if (byFolder) return byFolder;
  const names = [spec.folder, ...(spec.aliases || [])];
  const [legacy] = await query(`SELECT * FROM package WHERE stor_folder IS NULL AND name = ANY($1::varchar[]) ORDER BY number LIMIT 1`, [names]);
  return legacy || null;
}

async function applyPackage(query, spec) {
  const documents = spec.documents || [];
  const pending = spec.pending || [];
  const row = await findPackage(query, spec);

  if (!row) {
    const [{ next }] = await query(`SELECT coalesce(max(number), 0) + 1 AS next FROM package`, []);
    await query(
      `INSERT INTO package (id, number, name, type, locations, status, stor_folder, stor_numbers, stor_documents, stor_documents_pending,
                            created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::varchar[], $5, $6, $7::int[], $8::varchar[], $9::varchar[], now(), now())`,
      [next, spec.name, spec.type, spec.locations, spec.status || "draft", spec.folder, spec.numbers, documents, pending]
    );
    return "created";
  }

  const set = {};
  if (!row.stor_folder) set.stor_folder = spec.folder;
  if (row.name === spec.folder || (spec.aliases || []).includes(row.name)) set.name = spec.name;
  if (spec.prevType && row.type === spec.prevType) set.type = spec.type;
  if ((spec.prevLocations || []).some((prev) => sameSet(row.locations, prev))) set.locations = spec.locations;
  if (spec.numbers.length && (!row.stor_numbers || row.stor_numbers.length === 0)) set.stor_numbers = spec.numbers;

  // Documentos: tira só um código anterior conhecido (divisão dos refratários), acrescenta os novos, nunca apaga os demais.
  const prevDocs = spec.prevDocuments || [];
  const currentDocs = (row.stor_documents || []).filter((d) => !prevDocs.includes(d) || documents.includes(d));
  const docs = [...new Set([...currentDocs, ...documents])];
  if (!sameSet(docs, row.stor_documents || [])) set.stor_documents = docs;
  const currentPending = (row.stor_documents_pending || []).filter((d) => docs.includes(d));
  const pend = [...new Set([...currentPending, ...pending.filter((d) => docs.includes(d))])];
  if (!sameSet(pend, row.stor_documents_pending || [])) set.stor_documents_pending = pend;

  const fields = Object.keys(set);
  if (!fields.length) return "unchanged";
  const casts = { locations: "::varchar[]", stor_numbers: "::int[]", stor_documents: "::varchar[]", stor_documents_pending: "::varchar[]" };
  const assignments = fields.map((f, i) => `${f} = $${i + 2}${casts[f] || ""}`).join(", ");
  await query(`UPDATE package SET ${assignments}, updated_at = now() WHERE id = $1`, [row.id, ...fields.map((f) => set[f])]);
  return "updated";
}

module.exports = {
  PACKAGES,
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const query = (sql, bind) => queryInterface.sequelize.query(sql, { bind, transaction, type: queryInterface.sequelize.QueryTypes.SELECT });
      for (const spec of PACKAGES) await applyPackage(query, spec);
    });
  },
  // Dado de negócio: não há volta automática (apagar pacotes poderia levar itens e anexos já enviados pelo vendedor).
  async down() {}
};
