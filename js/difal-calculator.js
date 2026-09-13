(function () {
  "use strict";

  var form = document.getElementById("difal-form");
  if (!form) return;

  /* ============================================================
     Tabela SELIC mensal (%) — fonte: Banco Central do Brasil,
     série 4390 (Taxa de juros - Selic acumulada no mês).
     https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados
     Mantida como base fixa; o script tenta complementar com dados
     ao vivo da API do Bacen para meses mais recentes.
     ============================================================ */
  var SELIC = {
    "2018-01": 0.58, "2018-02": 0.47, "2018-03": 0.53, "2018-04": 0.52, "2018-05": 0.52, "2018-06": 0.52,
    "2018-07": 0.54, "2018-08": 0.57, "2018-09": 0.47, "2018-10": 0.54, "2018-11": 0.49, "2018-12": 0.49,
    "2019-01": 0.54, "2019-02": 0.49, "2019-03": 0.47, "2019-04": 0.52, "2019-05": 0.54, "2019-06": 0.47,
    "2019-07": 0.57, "2019-08": 0.50, "2019-09": 0.46, "2019-10": 0.48, "2019-11": 0.38, "2019-12": 0.37,
    "2020-01": 0.38, "2020-02": 0.29, "2020-03": 0.34, "2020-04": 0.28, "2020-05": 0.24, "2020-06": 0.21,
    "2020-07": 0.19, "2020-08": 0.16, "2020-09": 0.16, "2020-10": 0.16, "2020-11": 0.15, "2020-12": 0.16,
    "2021-01": 0.15, "2021-02": 0.13, "2021-03": 0.20, "2021-04": 0.21, "2021-05": 0.27, "2021-06": 0.31,
    "2021-07": 0.36, "2021-08": 0.43, "2021-09": 0.44, "2021-10": 0.49, "2021-11": 0.59, "2021-12": 0.77,
    "2022-01": 0.73, "2022-02": 0.76, "2022-03": 0.93, "2022-04": 0.83, "2022-05": 1.03, "2022-06": 1.02,
    "2022-07": 1.03, "2022-08": 1.17, "2022-09": 1.07, "2022-10": 1.02, "2022-11": 1.02, "2022-12": 1.12,
    "2023-01": 1.12, "2023-02": 0.92, "2023-03": 1.17, "2023-04": 0.92, "2023-05": 1.12, "2023-06": 1.07,
    "2023-07": 1.07, "2023-08": 1.14, "2023-09": 0.97, "2023-10": 1.00, "2023-11": 0.92, "2023-12": 0.89,
    "2024-01": 0.97, "2024-02": 0.80, "2024-03": 0.83, "2024-04": 0.89, "2024-05": 0.83, "2024-06": 0.79,
    "2024-07": 0.91, "2024-08": 0.87, "2024-09": 0.84, "2024-10": 0.93, "2024-11": 0.79, "2024-12": 0.93,
    "2025-01": 1.01, "2025-02": 0.99, "2025-03": 0.96, "2025-04": 1.06, "2025-05": 1.14, "2025-06": 1.10,
    "2025-07": 1.28, "2025-08": 1.16, "2025-09": 1.22, "2025-10": 1.28, "2025-11": 1.05, "2025-12": 1.22,
    "2026-01": 1.16, "2026-02": 1.00, "2026-03": 1.21, "2026-04": 1.09, "2026-05": 1.07, "2026-06": 1.12,
    "2026-07": 1.22, "2026-08": 1.09
  };

  var LAST_EMBEDDED_MONTH = "2026-08";
  var selicLive = false;

  /* ---------- Utilidades de data ---------- */
  function ymKey(year, month) {
    return year + "-" + String(month).padStart(2, "0");
  }

  function parseYm(value) {
    var parts = value.split("-");
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
  }

  function addMonths(ym, delta) {
    var total = ym.year * 12 + (ym.month - 1) + delta;
    var year = Math.floor(total / 12);
    var month = (total % 12) + 1;
    return { year: year, month: month };
  }

  function ymToIndex(ym) {
    return ym.year * 12 + ym.month;
  }

  function formatYm(ym) {
    var meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return meses[ym.month - 1] + "/" + ym.year;
  }

  /* ---------- Tenta atualizar a tabela SELIC com dados ao vivo do Bacen ---------- */
  function fetchLiveSelic() {
    var lastYm = parseYm(LAST_EMBEDDED_MONTH);
    var startFetch = addMonths(lastYm, 1);
    var dataInicial = String(startFetch.month).padStart(2, "0") + "/01/" + startFetch.year;
    var url =
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=" +
      dataInicial;

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Falha ao consultar Bacen");
        return res.json();
      })
      .then(function (rows) {
        rows.forEach(function (row) {
          var parts = row.data.split("/"); // dd/mm/aaaa
          var key = parts[2] + "-" + parts[1];
          var num = parseFloat(String(row.valor).replace(",", "."));
          if (!isNaN(num)) SELIC[key] = num;
        });
        selicLive = true;
      })
      .catch(function () {
        selicLive = false;
      });
  }

  function currentCalcMonth() {
    var now = new Date();
    var candidate = { year: now.getFullYear(), month: now.getMonth() + 1 };
    var candidateKey = ymKey(candidate.year, candidate.month);
    // Se o mês atual ainda não tem taxa disponível (mês em andamento),
    // usa o último mês com dado completo como referência do cálculo.
    if (SELIC[candidateKey] === undefined) {
      var lastKey = Object.keys(SELIC).sort().pop();
      return parseYm(lastKey);
    }
    return candidate;
  }

  /* ---------- Núcleo do cálculo ---------- */
  function fatorAcumulado(pagamentoYm, calculoYm) {
    // 1% referente ao mês do cálculo + soma da Selic mensal do mês
    // seguinte ao pagamento até o mês anterior ao cálculo.
    var fator = 1;
    var cursor = addMonths(pagamentoYm, 1);
    while (ymToIndex(cursor) < ymToIndex(calculoYm)) {
      var key = ymKey(cursor.year, cursor.month);
      fator += SELIC[key] !== undefined ? SELIC[key] : 0;
      cursor = addMonths(cursor, 1);
    }
    return fator;
  }

  function calcularRestituicao(valorMedio, inicioYm, fimYm) {
    var calculoYm = currentCalcMonth();
    var meses = [];
    var cursor = inicioYm;
    var totalOriginal = 0;
    var totalAtualizado = 0;

    while (ymToIndex(cursor) <= ymToIndex(fimYm)) {
      var fator = fatorAcumulado(cursor, calculoYm);
      var valorCorrigido = valorMedio * (1 + fator / 100);
      meses.push({
        ym: cursor,
        fator: fator,
        valorOriginal: valorMedio,
        valorCorrigido: valorCorrigido,
      });
      totalOriginal += valorMedio;
      totalAtualizado += valorCorrigido;
      cursor = addMonths(cursor, 1);
    }

    return {
      meses: meses,
      totalOriginal: totalOriginal,
      totalAtualizado: totalAtualizado,
      calculoYm: calculoYm,
      quantidadeMeses: meses.length,
    };
  }

  /* ---------- CNPJ: máscara e validação (módulo 11) ---------- */
  function maskCnpj(value) {
    var v = value.replace(/\D/g, "").slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
  }

  function isValidCnpj(raw) {
    var cnpj = raw.replace(/\D/g, "");
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    function calcDigit(base) {
      var weights = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      var sum = 0;
      for (var i = 0; i < base.length; i++) sum += parseInt(base.charAt(i), 10) * weights[i];
      var rest = sum % 11;
      return rest < 2 ? 0 : 11 - rest;
    }

    var base12 = cnpj.substring(0, 12);
    var digit1 = calcDigit(base12);
    var digit2 = calcDigit(base12 + String(digit1));
    return cnpj === base12 + String(digit1) + String(digit2);
  }

  var cnpjInput = document.getElementById("difal-cnpj");
  if (cnpjInput) {
    cnpjInput.addEventListener("input", function () {
      cnpjInput.value = maskCnpj(cnpjInput.value);
    });
  }

  var telInput = document.getElementById("difal-telefone");
  if (telInput) {
    telInput.addEventListener("input", function () {
      var v = telInput.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 10) {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
      } else if (v.length > 5) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else if (v.length > 2) {
        v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      }
      telInput.value = v.trim().replace(/-$/, "");
    });
  }

  function formatBRL(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* ---------- Fluxo do formulário ---------- */
  var resultBox = document.getElementById("difal-resultado");
  var statusEl = document.getElementById("difal-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  fetchLiveSelic();

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var cnpjEl = document.getElementById("difal-cnpj");
    if (!isValidCnpj(cnpjEl.value)) {
      cnpjEl.setCustomValidity("CNPJ inválido. Confira os números digitados.");
      cnpjEl.reportValidity();
      return;
    }
    cnpjEl.setCustomValidity("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var inicio = parseYm(document.getElementById("difal-inicio").value);
    var fim = parseYm(document.getElementById("difal-fim").value);
    var valor = parseFloat(document.getElementById("difal-valor").value.replace(",", "."));

    if (ymToIndex(inicio) > ymToIndex(fim)) {
      if (statusEl) {
        statusEl.textContent = "O mês inicial precisa ser anterior (ou igual) ao mês final.";
        statusEl.setAttribute("data-state", "error");
      }
      return;
    }

    var LIMITE_MIN = parseYm("2018-01");
    var LIMITE_MAX = parseYm("2024-02");
    if (ymToIndex(inicio) < ymToIndex(LIMITE_MIN) || ymToIndex(fim) > ymToIndex(LIMITE_MAX)) {
      if (statusEl) {
        statusEl.textContent = "O período precisa estar entre janeiro de 2018 e fevereiro de 2024.";
        statusEl.setAttribute("data-state", "error");
      }
      return;
    }

    var resultado = calcularRestituicao(valor, inicio, fim);

    var nome = document.getElementById("difal-nome").value.trim();
    var cnpj = cnpjEl.value;
    var email = document.getElementById("difal-email").value.trim();
    var telefone = document.getElementById("difal-telefone").value.trim();

    renderReport({
      nome: nome,
      cnpj: cnpj,
      email: email,
      telefone: telefone,
      inicio: inicio,
      fim: fim,
      valorMedio: valor,
      resultado: resultado,
    });

    enviarLead({ nome: nome, cnpj: cnpj, email: email, telefone: telefone, inicio: inicio, fim: fim, valor: valor, resultado: resultado });

    if (statusEl) {
      statusEl.textContent = "";
      statusEl.removeAttribute("data-state");
    }
  });

  function renderReport(data) {
    if (!resultBox) return;
    var r = data.resultado;
    var hoje = new Date();
    var dataCalculoStr = hoje.toLocaleDateString("pt-BR");

    var linhas = r.meses
      .map(function (m) {
        return (
          "<tr>" +
          "<td>" + formatYm(m.ym) + "</td>" +
          "<td>" + formatBRL(m.valorOriginal) + "</td>" +
          "<td>" + m.fator.toFixed(2).replace(".", ",") + "%</td>" +
          "<td>" + formatBRL(m.valorCorrigido) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    resultBox.innerHTML =
      '<div class="difal-report" id="difal-report">' +
      '<div class="difal-report-head">' +
      "<strong>Bueno Advogados</strong>" +
      "<span>Simulação de Restituição — DIFAL GO</span>" +
      "</div>" +
      '<div class="difal-report-meta grid grid-2">' +
      "<div><span class=\"hint\">Empresa</span><br />" + escapeHtml(data.nome) + "</div>" +
      "<div><span class=\"hint\">CNPJ</span><br />" + escapeHtml(data.cnpj) + "</div>" +
      "<div><span class=\"hint\">E-mail</span><br />" + escapeHtml(data.email) + "</div>" +
      "<div><span class=\"hint\">Telefone</span><br />" + escapeHtml(data.telefone) + "</div>" +
      "</div>" +
      '<hr class="divider" />' +
      '<div class="grid grid-2">' +
      "<div><span class=\"hint\">Período considerado</span><br />" + formatYm(data.inicio) + " a " + formatYm(data.fim) + " (" + r.quantidadeMeses + " meses)</div>" +
      "<div><span class=\"hint\">Valor médio mensal informado</span><br />" + formatBRL(data.valorMedio) + "</div>" +
      "<div><span class=\"hint\">Total original (sem atualização)</span><br />" + formatBRL(r.totalOriginal) + "</div>" +
      "<div><span class=\"hint\">Data do cálculo</span><br />" + dataCalculoStr + "</div>" +
      "</div>" +
      '<div class="difal-total">' +
      "<span>Valor estimado da restituição, atualizado pela SELIC</span>" +
      "<strong>" + formatBRL(r.totalAtualizado) + "</strong>" +
      "</div>" +
      '<details class="difal-detalhe">' +
      "<summary>Ver detalhamento mês a mês</summary>" +
      '<div class="table-scroll"><table class="difal-table"><thead><tr><th>Mês</th><th>Valor pago</th><th>Fator SELIC</th><th>Valor atualizado</th></tr></thead><tbody>' +
      linhas +
      "</tbody></table></div>" +
      "</details>" +
      '<p class="difal-disclaimer">Simulação estimativa, calculada com a taxa SELIC (Banco Central' +
      (selicLive ? "" : ", com base nos índices disponíveis até " + formatYm(parseYm(Object.keys(SELIC).sort().pop()))) +
      "). Não constitui garantia de êxito, parecer jurídico ou cálculo definitivo. Fale com o escritório para uma análise completa do seu caso." +
      "</p>" +
      '<button type="button" class="btn btn-outline-navy" id="difal-print">Imprimir / salvar em PDF</button>' +
      "</div>";

    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });

    var printBtn = document.getElementById("difal-print");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function enviarLead(data) {
    var leadForm = document.getElementById("difal-lead-form");
    if (!leadForm) return;
    var fd = new FormData(leadForm);
    fd.set("nome-empresa", data.nome);
    fd.set("cnpj", data.cnpj);
    fd.set("email", data.email);
    fd.set("telefone", data.telefone);
    fd.set("periodo", formatYm(data.inicio) + " a " + formatYm(data.fim));
    fd.set("valor-medio-mensal", formatBRL(data.valor));
    fd.set("valor-total-estimado", formatBRL(data.resultado.totalAtualizado));

    fetch(leadForm.getAttribute("action") || window.location.pathname, {
      method: "POST",
      body: fd,
    }).catch(function () {
      /* silencioso: a simulação já foi exibida ao usuário mesmo se o envio falhar */
    });
  }
})();
