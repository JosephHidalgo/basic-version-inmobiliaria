const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generarRecibo(pago, cuota, venta, lote, proyecto, cliente, totalPagadoVenta) {
  const doc = new PDFDocument({ margin: 50, size: 'A5' });
  const nombreArchivo = `${pago.numero_recibo}.pdf`;
  const recibosDir = path.join(__dirname, '..', 'recibos');

  if (!fs.existsSync(recibosDir)) {
    fs.mkdirSync(recibosDir, { recursive: true });
  }

  const rutaPDF = path.join(recibosDir, nombreArchivo);
  doc.pipe(fs.createWriteStream(rutaPDF));

  const pageWidth = 420;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  doc.fontSize(18).font('Helvetica-Bold').text('RECIBO DE PAGO', { align: 'center' });
  doc.fontSize(13).font('Helvetica-Bold').text(`N° ${pago.numero_recibo}`, { align: 'center' });
  doc.moveDown();

  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.5);

  const leftX = margin;
  const labelX = margin;
  const valueX = margin + 110;

  function writeLine(label, value) {
    doc.font('Helvetica-Bold').fontSize(10).text(label, labelX, doc.y, { width: 110, continued: true });
    doc.font('Helvetica').fontSize(10).text(value, { width: contentWidth - 110 });
  }

  writeLine('Fecha:', pago.fecha_pago);
  writeLine('Cliente:', cliente.nombre);
  writeLine('DNI:', cliente.dni || '-');
  doc.moveDown(0.3);
  writeLine('Proyecto:', proyecto.nombre);
  writeLine('Lote:', `${lote.codigo} — ${lote.nombre || ''}`);
  writeLine('Área:', `${lote.area_m2 || 0} m²`);
  doc.moveDown(0.3);

  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.3);

  writeLine('Cuota N°:', `${cuota.numero_cuota} de ${venta.num_cuotas}`);
  writeLine('Monto cuota:', `S/ ${(cuota.monto || 0).toFixed(2)}`);
  writeLine('Abono hoy:', `S/ ${(pago.monto_pagado || 0).toFixed(2)}`);
  const saldoCuota = (cuota.monto || 0) - (cuota.monto_pagado || 0);
  if (saldoCuota > 0) {
    writeLine('Saldo cuota:', `S/ ${saldoCuota.toFixed(2)}`);
  }
  const totalCobrado = (pago.monto_pagado || 0) + (pago.mora_cobrada || 0);
  if (pago.mora_cobrada > 0) {
    writeLine('Mora cobrada:', `S/ ${(pago.mora_cobrada || 0).toFixed(2)}`);
  }
  doc.font('Helvetica-Bold').fontSize(11);
  writeLine('Total cobrado:', `S/ ${totalCobrado.toFixed(2)}`);
  doc.font('Helvetica').fontSize(10);
  writeLine('Método:', pago.metodo_pago || 'efectivo');

  let saldoPendiente = 0;
  if (venta.tipo_pago === 'credito') {
    const totalVenta = (venta.precio_acordado || 0) - (venta.cuota_inicial || 0);
    const pagado = totalPagadoVenta !== undefined ? totalPagadoVenta : (cuota.monto_pagado || 0);
    saldoPendiente = Math.max(0, totalVenta - pagado);
  }
  writeLine('Saldo pendiente:', `S/ ${saldoPendiente.toFixed(2)}`);

  if (pago.observaciones) {
    doc.moveDown(0.3);
    writeLine('Observaciones:', pago.observaciones);
  }

  doc.moveDown(1.5);
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(1);
  doc.text('_________________________', { align: 'center' });
  doc.text('Responsable / Firma', { align: 'center', fontSize: 9 });

  doc.end();
  return nombreArchivo;
}

module.exports = { generarRecibo };
