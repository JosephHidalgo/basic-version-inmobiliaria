function generarCronograma(venta) {
  const { id, precio_acordado, cuota_inicial, num_cuotas, frecuencia_cuota, fecha_venta } = venta;

  const saldo = precio_acordado - cuota_inicial;
  const monto_cuota = parseFloat((saldo / num_cuotas).toFixed(2));
  const cuotas = [];

  for (let i = 1; i <= num_cuotas; i++) {
    cuotas.push({
      venta_id: id,
      numero_cuota: i,
      fecha_vencimiento: calcularFecha(fecha_venta, frecuencia_cuota, i),
      monto: i < num_cuotas ? monto_cuota : parseFloat((saldo - monto_cuota * (num_cuotas - 1)).toFixed(2)),
      monto_pagado: 0,
      mora: 0,
      estado: 'pendiente'
    });
  }

  return cuotas;
}

function calcularFecha(fechaBase, frecuencia, n) {
  const fecha = new Date(fechaBase);
  switch (frecuencia) {
    case 'diaria':
      fecha.setDate(fecha.getDate() + n);
      break;
    case 'semanal':
      fecha.setDate(fecha.getDate() + (7 * n));
      break;
    case 'mensual':
      fecha.setMonth(fecha.getMonth() + n);
      break;
    default:
      fecha.setMonth(fecha.getMonth() + n);
  }
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = { generarCronograma };
