export function guardarEmpresaYResponsable(empresa, responsable) {
  localStorage.setItem("empresa", empresa);
  localStorage.setItem("responsable", responsable);
}

export function cargarEmpresaYResponsable() {
  return {
    empresa: localStorage.getItem("empresa") || "",
    responsable: localStorage.getItem("responsable") || ""
  };
}
