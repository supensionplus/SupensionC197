// Construye el reporte en Word (.docx)

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel
} from "docx";

export async function construirReporteDOCX(informe) {

  const doc = new Document({
    sections: [{
      children: [

        // Título
        new Paragraph({
          text: "SUPENSION C197",
          heading: HeadingLevel.TITLE
        }),

        new Paragraph("Análisis de cotizaciones según Sentencia C-197 de 2023"),
        new Paragraph(`Empresa: ${informe.encabezado.empresa}`),
        new Paragraph(`Responsable: ${informe.encabezado.responsable}`),
        informe.encabezado.cliente
          ? new Paragraph(`Cliente: ${informe.encabezado.cliente}`)
          : new Paragraph(""),
        new Paragraph(`Fecha: ${informe.encabezado.fechaInforme}`),
        new Paragraph(`Estado: ${informe.encabezado.estado}`),

        new Paragraph({ text: "Objetivo del estudio", heading: HeadingLevel.HEADING_2 }),
        new Paragraph(informe.objetivo.descripcion),

        new Paragraph({ text: "Resultados", heading: HeadingLevel.HEADING_2 }),
        new Paragraph(
          informe.resultado.cumpleAntesDeEdad
            ? `Cumple semanas mínimas en ${informe.resultado.fechaCumplimientoSemanas}`
            : "Resultado según análisis realizado."
        ),

        new Paragraph({ text: "Detalle de cotizaciones", heading: HeadingLevel.HEADING_2 }),
        new Paragraph(renderTablaTexto(informe.tablas.tablaPrincipal)),

      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

function renderTablaTexto(filas) {
  let texto = "Año  Mes cotizado  Semanas mínimas  No. de semanas  Semanas acumuladas\n";
  filas.forEach(f => {
    texto += `${f.anio}  ${f.mes}  ${f.semanasMinimas}  ${f.semanasMes.toFixed(2)}  ${f.semanasAcumuladas.toFixed(2)}\n`;
  });
  return texto;
}
