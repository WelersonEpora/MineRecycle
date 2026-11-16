"use strict";

const MAX_DECIMALS = 4;
const MAX_ABS = 1e10;

function toDecimalString(n) {
  const rounded = Number(n.toFixed(MAX_DECIMALS));
  return String(rounded);
}

// Quantidade de uma célula de planilha -> { value: "123.5" | null, error?, warning? }.
// Célula numérica do Excel chega como número. Texto segue o formato brasileiro primeiro: "1.234,5" = 1234,5 e
// "12,5" = 12,5. "1.500" (só pontos em grupos de três) é lido como milhar e sinalizado como ambíguo.
function parseQuantity(input) {
  if (input === null || input === undefined) return { value: null };

  if (typeof input === "number") {
    if (!Number.isFinite(input)) return { value: null, error: "quantity_invalid" };
    return finish(input, false);
  }

  let s = String(input).trim().replace(/\s+/g, "");
  if (!s) return { value: null };
  if (!/^-?[\d.,]+$/.test(s) || !/\d/.test(s)) return { value: null, error: "quantity_invalid" };

  let ambiguous = false;
  const commas = (s.match(/,/g) || []).length;
  const dots = (s.match(/\./g) || []).length;

  if (commas && dots) {
    const decimalSep = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    if ((decimalSep === "," ? commas : dots) > 1) return { value: null, error: "quantity_invalid" };
    s = s.split(thousandsSep).join("").replace(decimalSep, ".");
  } else if (commas) {
    if (commas > 1) {
      if (!/^-?\d{1,3}(,\d{3})+$/.test(s)) return { value: null, error: "quantity_invalid" };
      s = s.replace(/,/g, "");
    } else {
      ambiguous = /^-?\d{1,3},\d{3}$/.test(s);
      s = s.replace(",", ".");
    }
  } else if (dots) {
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
      ambiguous = true;
      s = s.replace(/\./g, "");
    } else if (dots > 1) {
      return { value: null, error: "quantity_invalid" };
    }
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return { value: null, error: "quantity_invalid" };
  return finish(n, ambiguous);
}

function finish(n, ambiguous) {
  if (n < 0) return { value: null, error: "quantity_negative" };
  if (Math.abs(n) >= MAX_ABS) return { value: null, error: "quantity_too_large" };
  const result = { value: toDecimalString(n) };
  const decimals = (String(n).split(".")[1] || "").length;
  if (decimals > MAX_DECIMALS) result.warning = "quantity_rounded";
  else if (ambiguous) result.warning = "quantity_ambiguous";
  return result;
}

module.exports = { parseQuantity };
