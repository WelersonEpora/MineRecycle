"use strict";

// Situação de um pedido de informação depois de uma alteração da equipe. Pura (sem banco).
//
// current = { status, assignedTo, outcome }
// change  = { status?, assignedTo?, outcome? }   (só o que veio na requisição; null limpa)
//
// Regras:
// - Desfecho só existe em pedido concluído: informar um desfecho conclui o pedido; mudar a situação para outra que não
//   "done" apaga o desfecho.
// - Pedido novo que ganha responsável passa a "em atendimento" (o "Assumir"), a não ser que a situação venha junto.
function nextInquiryState(current, change) {
  const next = { status: current.status, assignedTo: current.assignedTo ?? null, outcome: current.outcome ?? null };
  if (change.assignedTo !== undefined) next.assignedTo = change.assignedTo;
  if (change.outcome !== undefined) next.outcome = change.outcome;
  if (change.status !== undefined) next.status = change.status;
  else if (change.outcome) next.status = "done";
  else if (change.assignedTo && current.status === "new") next.status = "in_progress";
  if (next.status !== "done") next.outcome = null;
  return next;
}

module.exports = { nextInquiryState };
