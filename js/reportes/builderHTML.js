// builderHTML.js
// Reporte premium en cards para pantalla/HTML imprimible.
// (Word/PDF queda formal en builderDOCX.js)

export function construirReporteHTML(informe) {
  const { encabezado, objetivo, resultado, tablas, conclusiones, recomendaciones } = informe;

  const tituloEstado = encabezado.estado === "DEFINITIVO" ? "Informe definitivo" : "Estudio preliminar";

  // Helpers de texto
  const clienteTxt = encabezado.cliente ? encabezado.cliente : "—";
  const cumpleTxt = resultado.cumpleAntesDeEdad
    ? `Cumple semanas mínimas en <b>${resultado.fechaCumplimientoSemanas}</b>.`
    : resultado.cumpleAlLlegarEdad
      ? "Cumple semanas mínimas al llegar a la edad de pensión."
      : "NO cumple semanas mínimas al llegar a la edad de pensión.";

  // Números (si existen)
  const semanasMin = (resultado.semanasMinimasAplicadas ?? 0);
  const semanasCumplir = (resultado.semanasAlCumplir ?? 0);
  const excedente = (resultado.excedenteSemanas ?? 0);
  const inc = (resultado.incrementoTasaReemplazo ?? 0);
  const diasSug = resultado.diasSugeridosCotizacion;

  // Recomendación simple (puedes mejorarla luego con reglas más finas)
  const recomendacionPrincipal = resultado.cumpleAntesDeEdad
    ? "No es obligatorio seguir cotizando para completar semanas; solo faltaría cumplir la edad."
    : (resultado.cumpleAlLlegarEdad
        ? "Al llegar a la edad, ya cumple el requisito mínimo de semanas. Evalúe si desea cotizar más para incrementar tasa."
        : "Debe continuar cotizando hasta completar el mínimo de semanas. Revise el periodo estimado en el detalle técnico.");

  return `
  <div class="reporte-premium">

    <!-- Encabezado (compacto) -->
    <div class="r-head">
      <div>
        <div class="r-kicker">${tituloEstado}</div>
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

    <!-- Cards: Resumen / Recomendación / Tasa -->
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
        ${resultado.cumpleAntesDeEdad ? `<p class="r-muted">Si decide seguir cotizando, el sistema puede proyectar hasta la edad para estimar el incremento por semanas adicionales.</p>` : ""}
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
        ${diasSug ? `<div class="r-callout">
          <b>Sugerencia técnica:</b> Para alcanzar el siguiente múltiplo de 50 semanas, podría cotizar aproximadamente
          <b>${Math.round(diasSug)} días</b> adicionales (si es viable).
        </div>` : `<p class="r-muted">Si el excedente no completa 50 semanas, el incremento puede ser 0%.</p>`}
      `)}

    </div>

    <!-- Conclusiones y recomendaciones (cards) -->
    <div class="r-grid r-grid-2">
      ${card("Conclusiones", renderList(conclusiones))}
      ${card("Recomendaciones", renderList(recomendaciones))}
    </div>

    <!-- Detalle técnico plegable -->

<details class="r-details">
  <summary>Ver detalle técnico (tablas mes a mes)</summary>

  <div class="r-details-body">
    <div class="r-details-note">
      <b>Nota de alcance:</b> Proyección basada en 4,29 semanas/mes y tabla de semanas mínimas C-197 (desde 2026).
      No calcula IBL ni mesada y no sustituye validación oficial de historia laboral.
    </div>

    <!-- Filtros -->
    <div class="r-filters">
      <div class="r-filter">
        <label>Año</label>
        <select id="filtroAnio">
          ${renderOpcionesAnios(tablas.tablaPrincipal)}
        </select>
      </div>

      <div class="r-filter">
        <label>Mes</label>
        <select id="filtroMes">
          ${renderOpcionesMeses()}
        </select>
      </div>

      <button class="btn ghost r-clear" type="button" onclick="window.__supensionLimpiarFiltros?.()">Limpiar</button>
    </div>

    <h4 class="r-h4">Tabla principal</h4>
    <div id="tablaPrincipalWrap">
      ${renderTabla(tablas.tablaPrincipal)}
    </div>

    ${tablas.tablaAdicional ? `
      <h4 class="r-h4">Tabla adicional</h4>
      <div id="tablaAdicionalWrap">
        ${renderTabla(tablas.tablaAdicional)}
      </div>
    ` : ""}

  </div>
</details>

<script>
  // ===== Filtro simple por Año/Mes (solo UI) =====
  (function(){
    const principal = ${JSON.stringify(tablas.tablaPrincipal)};
    const adicional = ${tablas.tablaAdicional ? JSON.stringify(tablas.tablaAdicional) : "null"};

    const anioSel = document.getElementById("filtroAnio");
    const mesSel = document.getElementById("filtroMes");

    function aplicar() {
      const anio = anioSel.value;
      const mes = mesSel.value;

      const filtrar = (arr) => arr.filter(f => {
        const okAnio = (anio === "ALL") ? true : String(f.anio) === anio;
        const okMes  = (mes === "ALL") ? true : String(f.mes).padStart(2,"0") === mes;
        return okAnio && okMes;
      });

      const p = filtrar(principal);
      document.getElementById("tablaPrincipalWrap").innerHTML = (${renderTabla.toString()})(p);

      if (adicional && document.getElementById("tablaAdicionalWrap")) {
        const a = filtrar(adicional);
        document.getElementById("tablaAdicionalWrap").innerHTML = (${renderTabla.toString()})(a);
      }
    }

    // Exponer limpiar a botón
    window.__supensionLimpiarFiltros = function() {
      anioSel.value = "ALL";
      mesSel.value = "ALL";
      aplicar();
    };

    anioSel.addEventListener("change", aplicar);
    mesSel.addEventListener("change", aplicar);
  })();
</script>

<script>


function renderOpcionesAnios(filas = []) {
  const anios = Array.from(new Set(filas.map(f => f.anio))).sort((a,b)=>a-b);
  const opts = anios.map(a => `<option value="${a}">${a}</option>`).join("");
  return `<option value="ALL">Todos</option>${opts}`;
}

function renderOpcionesMeses() {
  const meses = [
    ["ALL","Todos"],
    ["01","Enero"],["02","Febrero"],["03","Marzo"],["04","Abril"],["05","Mayo"],["06","Junio"],
    ["07","Julio"],["08","Agosto"],["09","Septiembre"],["10","Octubre"],["11","Noviembre"],["12","Diciembre"]
  ];
  return meses.map(([v,n]) => `<option value="${v}">${n}</option>`).join("");
}




  // ===== Filtro simple por Año/Mes (solo UI) =====
  (function(){
    const principal = ${JSON.stringify(tablas.tablaPrincipal)};
    const adicional = ${tablas.tablaAdicional ? JSON.stringify(tablas.tablaAdicional) : "null"};

    const anioSel = document.getElementById("filtroAnio");
    const mesSel = document.getElementById("filtroMes");

    function aplicar() {
      const anio = anioSel.value;
      const mes = mesSel.value;

      const filtrar = (arr) => arr.filter(f => {
        const okAnio = (anio === "ALL") ? true : String(f.anio) === anio;
        const okMes  = (mes === "ALL") ? true : String(f.mes).padStart(2,"0") === mes;
        return okAnio && okMes;
      });

      const p = filtrar(principal);
      document.getElementById("tablaPrincipalWrap").innerHTML = (${renderTabla.toString()})(p);

      if (adicional && document.getElementById("tablaAdicionalWrap")) {
        const a = filtrar(adicional);
        document.getElementById("tablaAdicionalWrap").innerHTML = (${renderTabla.toString()})(a);
      }
    }

    // Exponer limpiar a botón
    window.__supensionLimpiarFiltros = function() {
      anioSel.value = "ALL";
      mesSel.value = "ALL";
      aplicar();
    };

    anioSel.addEventListener("change", aplicar);
    mesSel.addEventListener("change", aplicar);
  })();
</script>


  </div>
  `;
}

// ---------- Helpers UI ----------
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

// Tabla monoespaciada (como tu estándar)
function renderTabla(filas = []) {
  let texto = "Año  Mes cotizado  Semanas mínimas  No. de semanas  Semanas acumuladas\n";
  texto += filas.map(f =>
    `${f.anio}  ${String(f.mes).padStart(2, "0")}           ${padN(f.semanasMinimas, 4)}            ${f.semanasMes.toFixed(2).padStart(5, " ")}           ${f.semanasAcumuladas.toFixed(2)}`
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

function padN(n, min) {
  const s = String(n ?? "");
  return s.padStart(min, " ");
}

// Evita que texto del usuario rompa HTML
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


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
  // Verde si cumple antes o cumple al llegar a la edad.
  if (resultado.cumpleAntesDeEdad || resultado.cumpleAlLlegarEdad) return "CUMPLE";
  return "NO CUMPLE";
}
