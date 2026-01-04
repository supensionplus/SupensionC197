import { PARAMETROS_C197 } from "./parametros.js";
import { parseFecha, sumarAnios, obtenerMesSiguiente } from "../utils/fechas.js";

export function calcularC197(caso) {

  // 1. Preparar fechas
  const fechaNacimiento = parseFecha(caso.fechaNacimiento);
  const fechaCorte = parseFecha(caso.fechaCorte);
  const fechaCumpleEdad = sumarAnios(
    fechaNacimiento,
    PARAMETROS_C197.EDAD_PENSION_MUJER
  );

  // 2. Punto de inicio
  let { anio, mes } = obtenerMesSiguiente(fechaCorte);
  let semanasAcumuladas = caso.semanasAlCorte;

  const filas = [];
  let cumpleAntes = false;
  let filaCumplimiento = null;

  // 3. Proyección mes a mes
  while (true) {

    const semanasMinimas =
      PARAMETROS_C197.TABLA_SEMANAS_MINIMAS[anio] ??
      PARAMETROS_C197.TABLA_SEMANAS_MINIMAS[2036];

    // Regla diciembre → enero
    if (
      mes === 12 &&
      PARAMETROS_C197.APLICAR_REGLA_DICIEMBRE_ENERO
    ) {
      const minSiguiente =
        PARAMETROS_C197.TABLA_SEMANAS_MINIMAS[anio + 1] ??
        PARAMETROS_C197.TABLA_SEMANAS_MINIMAS[2036];

      if (
        semanasAcumuladas < semanasMinimas &&
        semanasAcumuladas >= minSiguiente
      ) {
        filas.push({
          anio: anio + 1,
          mes: 1,
          semanasMinimas: minSiguiente,
          semanasMes: 0,
          semanasAcumuladas
        });
        cumpleAntes = true;
        filaCumplimiento = filas[filas.length - 1];
        break;
      }
    }

    // Cotización normal
    semanasAcumuladas += PARAMETROS_C197.SEMANAS_POR_MES;

    const fila = {
      anio,
      mes,
      semanasMinimas,
      semanasMes: PARAMETROS_C197.SEMANAS_POR_MES,
      semanasAcumuladas
    };

    filas.push(fila);

    // ¿Cumple semanas?
    if (!cumpleAntes && semanasAcumuladas >= semanasMinimas) {
      cumpleAntes = true;
      filaCumplimiento = fila;
      if (!caso.analizarSeguirHastaEdad) break;
    }

    // ¿Llegó a la edad?
    const fechaActual = new Date(anio, mes - 1, 1);
    if (fechaActual >= fechaCumpleEdad) break;

    // Avanzar mes
    if (mes === 12) {
      mes = 1;
      anio++;
    } else {
      mes++;
    }
  }

  return {
    filas,
    cumpleAntes,
    filaCumplimiento
  };
}
