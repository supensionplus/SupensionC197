// Convierte "DD/MM/AAAA" a objeto Date
export function parseFecha(fechaTexto) {
  const [d, m, a] = fechaTexto.split("/");
  return new Date(a, m - 1, d);
}

// Suma años a una fecha
export function sumarAnios(fecha, anios) {
  const nueva = new Date(fecha);
  nueva.setFullYear(nueva.getFullYear() + anios);
  return nueva;
}

// Obtiene el mes siguiente a una fecha
export function obtenerMesSiguiente(fecha) {
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();

  if (mes === 12) {
    return { anio: anio + 1, mes: 1 };
  }
  return { anio, mes: mes + 1 };
}
