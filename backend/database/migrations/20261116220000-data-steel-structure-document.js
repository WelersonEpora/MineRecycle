"use strict";

// Dados: liga a planilha 1809537 ao pacote Steel Structure (pasta "19-30-Steel Structure"), como pendente de validação.
// A 1809537 é uma proposta (uma linha, com preço e valor), não lista de itens: fica ligada para a importação reconhecer
// o código, mas pendente, para ninguém importá-la sem confirmar. Os itens do pacote entram à mão.
//
// Idempotente e sem sobrescrever o vendedor: só acrescenta o código se ele ainda não estiver no pacote; nunca remove
// nada. Se o pacote não existir (pasta trocada ou pacote apagado), não faz nada. Sem preço, valor ou comprador.

const LINKS = [{ folder: "19-30-Steel Structure", document: "1809537", pending: true }];

module.exports = {
  LINKS,
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      for (const link of LINKS) {
        const [row] = await sequelize.query(`SELECT id, stor_documents FROM package WHERE stor_folder = $1`, {
          bind: [link.folder],
          transaction,
          type: sequelize.QueryTypes.SELECT
        });
        if (!row || (row.stor_documents || []).includes(link.document)) continue;
        await sequelize.query(
          `UPDATE package
              SET stor_documents = array_append(stor_documents, $2::varchar),
                  stor_documents_pending = CASE WHEN $3::boolean THEN array_append(stor_documents_pending, $2::varchar)
                                                ELSE stor_documents_pending END,
                  updated_at = now()
            WHERE id = $1`,
          { bind: [row.id, link.document, link.pending], transaction }
        );
      }
    });
  },
  // Dado de negócio: sem volta automática (o vendedor pode já ter mexido nos códigos do pacote).
  async down() {}
};
