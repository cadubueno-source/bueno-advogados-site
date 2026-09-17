#!/usr/bin/env node
/**
 * Atualiza a lista de "Documentos e modelos" da área de Acesso Interno.
 *
 * Como usar:
 *   1. Coloque os arquivos que devem aparecer na área interna dentro da pasta
 *      "documentos-para-acesso-interno" (na raiz do site). Essa pasta é só local
 *      no seu computador — nunca é enviada ao GitHub/Netlify.
 *   2. Dê dois cliques em "atualizar-documentos.bat" (ou rode "node scripts/atualizar-documentos.js").
 *   3. Abra o GitHub Desktop, confira a mudança em
 *      "netlify/functions/acesso-interno.js", faça o commit e o push, como sempre.
 *
 * A lista que aparece na página é sempre a foto exata do conteúdo dessa pasta:
 * se você tirar um arquivo da pasta e rodar de novo, ele some da página também.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PASTA_DOCUMENTOS = path.join(ROOT, "documentos-para-acesso-interno");
const ARQUIVO_FUNCTION = path.join(ROOT, "netlify", "functions", "acesso-interno.js");

const MARCADOR_DOCS_INICIO = "/* INICIO-DOCUMENTOS (gerado automaticamente, não edite à mão) */";
const MARCADOR_DOCS_FIM = "/* FIM-DOCUMENTOS */";
const MARCADOR_LISTA_INICIO = "<!-- INICIO-LISTA-DOCUMENTOS (gerado automaticamente, não edite à mão) -->";
const MARCADOR_LISTA_FIM = "<!-- FIM-LISTA-DOCUMENTOS -->";

const TIPOS = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".zip": "application/zip",
};

function slugify(nomeSemExtensao) {
  return nomeSemExtensao
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "arquivo";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  if (!fs.existsSync(PASTA_DOCUMENTOS)) {
    fs.mkdirSync(PASTA_DOCUMENTOS, { recursive: true });
    console.log('Criei a pasta "documentos-para-acesso-interno". Coloque os arquivos nela e rode este script de novo.');
    return;
  }

  const arquivos = fs.readdirSync(PASTA_DOCUMENTOS, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => {
      const ma = fs.statSync(path.join(PASTA_DOCUMENTOS, a)).mtimeMs;
      const mb = fs.statSync(path.join(PASTA_DOCUMENTOS, b)).mtimeMs;
      return mb - ma; // mais recentes primeiro
    });

  if (arquivos.length === 0) {
    console.log('A pasta "documentos-para-acesso-interno" está vazia — nenhum documento será listado.');
  }

  const usados = new Set();
  const entradasDocumentos = [];
  const itensLista = [];

  for (const nomeArquivo of arquivos) {
    const caminhoCompleto = path.join(PASTA_DOCUMENTOS, nomeArquivo);
    const ext = path.extname(nomeArquivo).toLowerCase();
    const nomeSemExt = nomeArquivo.slice(0, nomeArquivo.length - ext.length);
    const contentType = TIPOS[ext] || "application/octet-stream";

    let slug = slugify(nomeSemExt) + ext;
    let candidato = slug;
    let i = 2;
    while (usados.has(candidato)) {
      candidato = slugify(nomeSemExt) + "-" + i + ext;
      i++;
    }
    usados.add(candidato);

    const buffer = fs.readFileSync(caminhoCompleto);
    const base64 = buffer.toString("base64");
    const urlPath = "/acesso-interno/arquivos/" + candidato;

    entradasDocumentos.push(
      `  ${JSON.stringify(urlPath)}: {\n` +
      `    contentType: ${JSON.stringify(contentType)},\n` +
      `    filename: ${JSON.stringify(nomeArquivo)},\n` +
      `    base64: ${JSON.stringify(base64)},\n` +
      `  },`
    );

    itensLista.push(
      `            <li><a class="card-link" href="${urlPath}" target="_blank" rel="noopener">${escapeHtml(nomeSemExt)}</a></li>`
    );

    console.log("Incluído:", nomeArquivo, "->", urlPath);
  }

  const blocoDocumentos = entradasDocumentos.length
    ? entradasDocumentos.join("\n")
    : "  // (nenhum arquivo em documentos-para-acesso-interno)";

  const blocoLista = itensLista.length
    ? itensLista.join("\n")
    : "            <li>Nenhum documento disponível no momento.</li>";

  let conteudo = fs.readFileSync(ARQUIVO_FUNCTION, "utf-8");

  conteudo = substituirEntreMarcadores(conteudo, MARCADOR_DOCS_INICIO, MARCADOR_DOCS_FIM, blocoDocumentos);
  conteudo = substituirEntreMarcadores(conteudo, MARCADOR_LISTA_INICIO, MARCADOR_LISTA_FIM, blocoLista);

  fs.writeFileSync(ARQUIVO_FUNCTION, conteudo, "utf-8");
  console.log("\nPronto! netlify/functions/acesso-interno.js foi atualizado com", arquivos.length, "documento(s).");
  console.log("Agora é só ir no GitHub Desktop, revisar, dar commit e push.");
}

function substituirEntreMarcadores(texto, inicio, fim, novoConteudo) {
  const iInicio = texto.indexOf(inicio);
  const iFim = texto.indexOf(fim);
  if (iInicio === -1 || iFim === -1 || iFim < iInicio) {
    throw new Error("Não encontrei os marcadores " + inicio + " / " + fim + " em acesso-interno.js. Não mexi no arquivo.");
  }
  const antes = texto.slice(0, iInicio + inicio.length);
  const depois = texto.slice(iFim);
  return antes + "\n" + novoConteudo + "\n  " + depois;
}

main();
