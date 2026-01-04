export function calcularTasa(semanasTotales, semanasMinimas) {
  const excedente = semanasTotales - semanasMinimas;
  const bloques = Math.floor(excedente / 50);
  const incremento = bloques * 1.5;

  let diasSugeridos = null;
  const resto = (bloques + 1) * 50 - excedente;

  if (resto > 0 && resto < 4.29) {
    diasSugeridos = resto * 7;
  }

  return {
    excedente,
    bloques,
    incremento,
    diasSugeridos
  };
}
