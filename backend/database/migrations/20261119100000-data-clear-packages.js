"use strict";

// Mudança de rota de 2026-11-19: o inventário passa a vir da planilha de lotes (aba "Matriz de lotes"), e os pacotes
// viram agrupamentos de lotes. Os pacotes, itens e anexos cadastrados até aqui seguiam o modelo antigo (STOR) e são
// apagados, com os pedidos e links de comprador que apontavam para eles. Decisão do usuário: o sistema ainda não estava
// em uso real.
//
// Os arquivos dos anexos ficam no storage, fora do alcance da migration: `npm run files:orphans -- --delete` os
// remove depois.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "TRUNCATE inquiry, access_log, access_link_package, access_link, attachment, package_line, package RESTART IDENTITY"
    );
  },

  // Não há volta: os dados apagados não existem mais.
  async down() {}
};
