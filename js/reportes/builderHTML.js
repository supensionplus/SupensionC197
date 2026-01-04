// builderHTML.js - versión robusta (sin scripts embebidos)
export function construirReporteHTML(informe) {
  const { encabezado, objetivo, resultado, tablas, conclusiones, recomendaciones } = informe;

  const clienteTxt = encabezado.cliente ? encabezado.cliente : "—";
  const cumpleTxt = resultado.cumpleAntesDeEdad
    ? `Cumple semanas mínimas en <b>${resultado.fechaCumplimientoSemanas}</b>.`
    : resultado.cumpleAlLlegarEdad
      ? "Cumple semanas mínimas al llegar a la edad de pensión."
      : "NO cumple semanas mínimas al llegar a la edad de pensión.";

  const semanasMin = (resultado.semanasMinimasAplicadas ?? 0);
  const semanasCumplir = (resultado.semanasAlCumplir ?? 0);
  const excedente = (resultado.excedenteSemanas ?? 0);
  const inc = (resultado.incrementoTasaReemplazo ?? 0);
  const diasSug = resultado.diasSugeridosCotizacion;

  const recomendacionPrincipal = resultado.cumpleAntesDeEdad
    ? "No es obligatorio seguir cotizando para completar semanas; solo faltaría cumplir la edad."
    : (resultado.cumpleAlLlegarEdad
        ? "Al llegar a la edad, ya cumple el mínimo de semanas. Evalúe si desea cotizar más para incrementar la tasa."
        : "Debe continuar cotizando hasta completar el mínimo de semanas. Revise el periodo estimado en el detalle técnico.");

  return `
  <div class="reporte-premium">

    <div class="r-head">
      <div>
        <div class="r-kicker">${escapeHtml(encabezado.estado === "DEFINITIVO" ? "Informe definitivo" : "Estudio preliminar")}</div>
        <div class="r-title">Análisis de cotizaciones · Sentencia C-197 de 2023</div>
        <div class="r-sub">
          <span><b>Empresa:</b> ${escapeHtml(encabezado.empresa)}</span>
          <span><b>Responsable:</b> ${escapeHtml(encabezado.responsable)}</span>
          <span><b>Cliente:</b> ${escapeHtml(clienteTxt)}</span>
          <span><b>Fecha:</b> ${escapeHtml(encabezado.fechaInforme)}</span>
        </div>
      </div>

      ${renderEstadoBadge(resultado, encabezado.estado)}
    </div>

    <div class="r-grid">
      ${card("Resultado principal", `
        <p class="r-strong">${cumpleTxt}</p>
        <div class="r-metrics">
          <div class="metric">
            <div class="m-label">Semanas mínimas aplicadas</div>
            <div class="m-value">${fmt2(semanasMin)}</div>
          </div>
          <div class="metric">
            <div class="m-label">Semanas al cumplimiento</div>
            <div class="m-value">${fmt2(semanasCumplir)}</div>
          </div>
        </div>
      `)}

      ${card("Objetivo del estudio", `
        <p class="r-muted">${escapeHtml(objetivo.descripcion || "")}</p>
      `)}

      ${card("Recomendación", `
        <p class="r-strong">${escapeHtml(recomendacionPrincipal)}</p>
      `)}

      ${card("Tasa de reemplazo (por semanas)", `
        <div class="r-metrics">
          <div class="metric">
            <div class="m-label">Excedente</div>
            <div class="m-value">${fmt2(excedente)}</div>
          </div>
          <div class="metric">
            <div class="m-label">Incremento estimado</div>
            <div class="m-value">${fmtPct(inc)}</div>
          </div>
        </div>
        ${diasSug
          ? `<div class="r-callout"><b>Sugerencia técnica:</b> podría cotizar <b>${Math.round(diasSug)} días</b> adicionales para alcanzar el siguiente múltiplo de 50 semanas.</div>`
          : `<p class="r-muted">Si el excedente no completa 50 semanas, el incremento puede ser 0%.</p>`
        }
      `)}
    </div>

    <div class="r-grid r-grid-2">
      ${card("Conclusiones", renderList(conclusiones))}
      ${card("Recomendaciones", renderList(recomendaciones))}
    </div>

    <details class="r-details" open>
      <summary>Ver detalle técnico (tablas mes a mes)</summary>

      <div class="r-details-body">
        <div class="r-details-note">
          <b>Nota de alcance:</b> Proyección basada en 4,29 semanas/mes y tabla C-197 (desde 2026).
          No calcula IBL ni mesada.
        </div>

        <!-- Filtros (sin lógica aquí; app.js los activa) -->
        <div class="r-filters">
          <div class="r-filter">
            <label>Año</label>
            <select id="filtroAnio"></select>
          </div>

          <div class="r-filter">
            <label>Mes</label>
            <select id="filtroMes"></select>
          </div>

          <button class="btn ghost r-clear" type="button" id="btnLimpiarFiltros">Limpiar</button>
        </div>

        <h4 class="r-h4">Tabla principal</h4>
        <div id="tablaPrincipalWrap">${renderTabla(tablas.tablaPrincipal || [])}</div>

        ${tablas.tablaAdicional ? `
          <h4 class="r-h4">Tabla adicional</h4>
          <div id="tablaAdicionalWrap">${renderTabla(tablas.tablaAdicional || [])}</div>
        ` : ""}
      </div>
    </details>

  </div>
  `;
}

// ===== Helpers UI =====
function card(title, bodyHtml) {
  return `
    <div class="r-card">
      <div class="r-card-title">${title}</div>
      <div class="r-card-body">${bodyHtml}</div>
    </div>
  `;
}

function renderList(items = []) {
  if (!items.length) return `<p class="r-muted">—</p>`;
  return `<ul class="r-ul">${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

export function renderTabla(filas = []) {
  let texto = "Año  Mes cotizado  Semanas mínimas  No. de semanas  Semanas acumuladas\n";
  texto += filas.map(f =>
    `${f.anio}  ${String(f.mes).padStart(2, "0")}           ${String(f.semanasMinimas).padStart(4, " ")}            ${Number(f.semanasMes).toFixed(2).padStart(5, " ")}           ${Number(f.semanasAcumuladas).toFixed(2)}`
  ).join("\n");
  return `<pre class="tabla">${texto}</pre>`;
}

function fmt2(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(2);
}

function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${Number(n).toFixed(1)}%`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===== Badges =====
function renderEstadoBadge(resultado, estadoDoc) {
  const estado = getEstadoCumplimiento(resultado); // CUMPLE / NO CUMPLE
  const clase = estado === "CUMPLE" ? "ok" : "bad";

  return `
    <div class="r-badges">
      <span class="r-badge doc">${escapeHtml(estadoDoc)}</span>
      <span class="r-badge ${clase}">${estado}</span>
    </div>
  `;
}

function getEstadoCumplimiento(resultado) {
  if (resultado.cumpleAntesDeEdad || resultado.cumpleAlLlegarEdad) return "CUMPLE";
  return "NO CUMPLE";
}
