import { calcularC197 } from "./domain/calculadora.js";
import { construirReporteHTML, renderTabla } from "./reportes/builderHTML.js";
import { cargarEmpresaYResponsable, guardarEmpresaYResponsable } from "./utils/storage.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1) Precargar empresa/responsable desde localStorage
  const saved = cargarEmpresaYResponsable();
  const empresaEl = document.getElementById("empresa");
  const respEl = document.getElementById("responsable");
  if (empresaEl) empresaEl.value = saved.empresa || "";
  if (respEl) respEl.value = saved.responsable || "";

  // 2) Botón generar
  document.getElementById("btnGenerar").addEventListener("click", () => {
    try {
      const caso = leerFormulario();

      // Validación mínima (si falla, alerta y no sigue)
      const ok = validarCaso(caso);
      if (!ok) return;

      // Guardar defaults
      guardarEmpresaYResponsable(caso.empresa, caso.responsable);

      // 3) Calcular
      const motor = calcularC197(caso);

      // 4) Armar informe (mínimo viable para render premium)
      const informe = construirInforme(caso, motor);

      // 5) Pintar resultado en cards (builder premium)
      const html = construirReporteHTML(informe);
      document.getElementById("resultado").innerHTML = html;
      activarFiltrosDetalle(informe);

    } catch (e) {
      console.error(e);
      alert("Hubo un error. Abre F12 > Console y copia el error para revisarlo.");
    }
  });
});

function leerFormulario() {
  const objetivoSel = document.querySelector("input[name='objetivo']:checked");
  const objetivoTipo = objetivoSel ? objetivoSel.value : null;

  return {
    empresa: document.getElementById("empresa").value.trim(),
    responsable: document.getElementById("responsable").value.trim(),
    nombreCliente: document.getElementById("cliente").value.trim(),

    fechaNacimiento: document.getElementById("fechaNacimiento").value.trim(),
    fechaCorte: document.getElementById("fechaCorte").value.trim(),
    semanasAlCorte: parseFloat(document.getElementById("semanasCorte").value.replace(",", ".")),

    analizarSeguirHastaEdad: document.getElementById("seguirEdad").checked,

    objetivoTipo,
    objetivoDescripcion: (document.getElementById("objetivoTexto")?.value || "").trim(),

    esDefinitivo: false
  };
}

function validarCaso(c) {
  if (!c.empresa) return alert("Falta Empresa"), false;
  if (!c.responsable) return alert("Falta Responsable"), false;
  if (!c.fechaNacimiento) return alert("Falta Fecha de nacimiento"), false;
  if (!c.fechaCorte) return alert("Falta Fecha de corte"), false;
  if (Number.isNaN(c.semanasAlCorte)) return alert("Semanas al corte inválidas"), false;
  if (!c.objetivoTipo) return alert("Selecciona objetivo A/B/C/D"), false;
  if (c.objetivoTipo === "D" && !c.objetivoDescripcion) return alert("Describe el objetivo (D)"), false;
  return true;
}

function construirInforme(caso, motor) {
  const hoy = new Date();
  const fechaInforme = formatDDMMYYYY(hoy);

  // Resultado mínimo (luego lo enriquecemos con tasa y tablas adicionales)
  const cumpleAntes = motor.cumpleAntes;
  const filaCumple = motor.filaCumplimiento;

  return {
    encabezado: {
      empresa: caso.empresa,
      responsable: caso.responsable,
      cliente: caso.nombreCliente || null,
      fechaInforme,
      estado: caso.esDefinitivo ? "DEFINITIVO" : "PRELIMINAR"
    },
    objetivo: {
      tipo: caso.objetivoTipo,
      descripcion: caso.objetivoTipo === "D"
        ? caso.objetivoDescripcion
        : objetivoTexto(caso.objetivoTipo)
    },
    resultado: {
      cumpleAntesDeEdad: cumpleAntes,
      cumpleAlLlegarEdad: false, // por ahora (lo enriquecemos luego)
      fechaCumplimientoSemanas: filaCumple ? `${String(filaCumple.mes).padStart(2,"0")}/${filaCumple.anio}` : null,
      semanasAlCumplir: filaCumple ? filaCumple.semanasAcumuladas : null,
      semanasMinimasAplicadas: filaCumple ? filaCumple.semanasMinimas : null,

      excedenteSemanas: 0,
      incrementoTasaReemplazo: 0,
      diasSugeridosCotizacion: null
    },
    tablas: {
      tablaPrincipal: motor.filas
    },
    conclusiones: [
      "Este estudio es preliminar y se basa exclusivamente en semanas cotizadas.",
      "No calcula IBL ni mesada y no reemplaza la validación oficial de historia laboral."
    ],
    recomendaciones: [
      "Verificar historia laboral con el operador pensional.",
      "Usar este resultado para planeación de cotizaciones."
    ]
  };
}

function objetivoTexto(tipo) {
  return ({
    A: "Saber si cumple semanas al llegar a la edad de pensión.",
    B: "Saber cuántas semanas faltan y hasta cuándo debe cotizar.",
    C: "Si cumple antes, estimar incremento por seguir cotizando hasta la edad."
  })[tipo] || "—";
}

function formatDDMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function activarFiltrosDetalle(informe) {
  const anioSel = document.getElementById("filtroAnio");
  const mesSel = document.getElementById("filtroMes");
  const btnClear = document.getElementById("btnLimpiarFiltros");

  // Si todavía no existe (por ejemplo antes de generar), salimos
  if (!anioSel || !mesSel || !btnClear) return;

  const principal = (informe.tablas?.tablaPrincipal || []);
  const adicional = (informe.tablas?.tablaAdicional || null);

  // Llenar opciones de año
  const anios = Array.from(new Set(principal.map(f => f.anio))).sort((a,b)=>a-b);
  anioSel.innerHTML = `<option value="ALL">Todos</option>` + anios.map(a => `<option value="${a}">${a}</option>`).join("");

  // Llenar meses
  mesSel.innerHTML = `
    <option value="ALL">Todos</option>
    <option value="01">Enero</option><option value="02">Febrero</option><option value="03">Marzo</option>
    <option value="04">Abril</option><option value="05">Mayo</option><option value="06">Junio</option>
    <option value="07">Julio</option><option value="08">Agosto</option><option value="09">Septiembre</option>
    <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
  `;

  function filtrar(arr) {
    const anio = anioSel.value;
    const mes = mesSel.value;

    return arr.filter(f => {
      const okAnio = (anio === "ALL") ? true : String(f.anio) === anio;
      const okMes = (mes === "ALL") ? true : String(f.mes).padStart(2, "0") === mes;
      return okAnio && okMes;
    });
  }

  function pintar() {
    const p = filtrar(principal);
    document.getElementById("tablaPrincipalWrap").innerHTML = renderTabla(p);

    if (adicional && document.getElementById("tablaAdicionalWrap")) {
      const a = filtrar(adicional);
      document.getElementById("tablaAdicionalWrap").innerHTML = renderTabla(a);
    }
  }

  anioSel.addEventListener("change", pintar);
  mesSel.addEventListener("change", pintar);

  btnClear.addEventListener("click", () => {
    anioSel.value = "ALL";
    mesSel.value = "ALL";
    pintar();
  });

  // Render inicial
  pintar();
}
