/**
 * Respaldo de la app del hito de cierre PBV 2026 (Apps Script + Google Sheets).
 *
 * - doPost: guarda las respuestas de una persona.
 * - doGet?action=data&tienda=envigado|cali|bogota|todas: devuelve las respuestas visibles
 *   (para el tendedero y el tablero). El nombre solo viaja si la persona lo autorizó.
 *
 * Moderación: en la hoja "Respuestas", escribe NO en la columna "visible"
 * para ocultar una respuesta del tendedero y del tablero.
 */

const SHEET_NAME = 'Respuestas';
const HEADERS = ['fecha', 'id', 'tienda', 'rol', 'nombre', 'anonimo', 'autorizacion', 'experiencia', 'logro', 'mejora', 'sueno', 'visible'];
const TIENDAS = ['envigado', 'cali', 'bogota'];
const TEMAS = ['logro', 'mejora', 'sueno'];
const MAX_CHARS = 160;
const MAX_NOMBRE = 60;
const MAX_ROL = 40;

/** Ejecutar una vez desde el editor para crear la hoja con sus encabezados. */
function setup() {
  const sheet = getSheet_();
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build();
  sheet.getRange(2, HEADERS.length, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  sheet.setFrozenRows(1);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'data') {
    const tienda = String(p.tienda || '').toLowerCase();
    if (tienda !== 'todas' && TIENDAS.indexOf(tienda) === -1) return json_({ ok: false, error: 'tienda' });
    return json_({ ok: true, respuestas: data_(tienda) });
  }
  return json_({ ok: true, app: 'hito-cierre-pbv-2026' });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'formato' });
  }

  const tienda = String(data.tienda || '').toLowerCase();
  if (TIENDAS.indexOf(tienda) === -1) return json_({ ok: false, error: 'tienda' });

  const resp = {};
  let alguna = false;
  TEMAS.forEach(function (t) {
    resp[t] = clean_(data[t], MAX_CHARS);
    if (resp[t]) alguna = true;
  });
  if (!alguna) return json_({ ok: false, error: 'vacio' });

  const exp = Number(data.experiencia);
  const experiencia = exp >= 1 && exp <= 5 ? Math.round(exp) : '';

  const autorizacion = data.autorizacion === true;
  let nombre = clean_(data.nombre, MAX_NOMBRE);
  // Sin autorización, o si eligió participar de forma anónima, no se guarda el nombre.
  if (data.anonimo === true || !autorizacion) nombre = '';

  const id = Utilities.getUuid();
  const row = [
    new Date(), id, tienda,
    clean_(data.rol, MAX_ROL),
    nombre,
    nombre ? 'NO' : 'SI',
    nombre ? 'SI' : 'NO',
    experiencia,
    resp.logro, resp.mejora, resp.sueno,
    'SI'
  ];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, id: id });
}

function data_(tienda) {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const c = {};
  HEADERS.forEach(function (h, i) { c[h] = i; });

  const out = [];
  rows.forEach(function (r) {
    const t = String(r[c.tienda]);
    if (tienda !== 'todas' && t !== tienda) return;
    if (String(r[c.visible]).toUpperCase() === 'NO') return;
    const mostrarNombre = r[c.autorizacion] === 'SI' && r[c.nombre];
    out.push({
      id: String(r[c.id]),
      ts: new Date(r[c.fecha]).getTime(),
      tienda: t,
      rol: unescape_(r[c.rol]),
      nombre: mostrarNombre ? unescape_(r[c.nombre]) : '',
      experiencia: Number(r[c.experiencia]) || null,
      logro: unescape_(r[c.logro]),
      mejora: unescape_(r[c.mejora]),
      sueno: unescape_(r[c.sueno])
    });
  });
  return out;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

/** Limpia el texto y evita que la hoja lo interprete como fórmula. */
function clean_(v, max) {
  if (v === null || v === undefined) return '';
  let s = String(v).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function unescape_(v) {
  const s = String(v === null || v === undefined ? '' : v);
  return s.charAt(0) === "'" ? s.slice(1) : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
