/**
 * Documento PDF del presupuesto (C-09).
 *
 * Construye el documento de `@react-pdf/renderer` a partir del `LeadPayload`
 * (KB 04). Está escrito **sin JSX** (`createElement`) a propósito: Node no
 * transforma JSX y el módulo debe poder importarse desde `node:test` tal cual.
 *
 * La generación real ocurre en `pdfGenerator.js` (import dinámico, best-effort
 * RN-PD-03 y conversión a base64). Este módulo solo define el documento y un
 * modelo de secciones puro y testeable: `buildPdfSections`.
 *
 * Reglas que aplica: cantidad multiplica al servicio (RN-PR-03), recurrentes
 * separados como "/mes" (RN-PR-05), "A cotizar" deriva de `hasQuotable`
 * (RN-CO-02), disclaimer de hosting si se incluyó (RN-HD-02/03) y nota de
 * estimación no vinculante (RN-PD-02).
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

import { formatARS, splitRecurring } from './pricing.js'
import { QUOTABLE_LABEL, extraPriceLabel } from './priceLabels.js'
import { HOSTING_DISCLAIMER } from '../data/configurador.js'

/** Formateador de fecha es-AR (mismo idioma de la UI). */
const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' })

/** Normaliza un importe a número utilizable (0 si no es finito). */
const toAmount = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0

/** Textos fijos del documento. */
const EMISOR = 'Facundo Chacón'
const TITULO = 'Presupuesto web'
/** Nota de estimación no vinculante (RN-PR-07). */
export const NOTA_NO_VINCULANTE =
  'Estimación no vinculante: los montos expresados son de referencia y el precio final se confirma por email al responder esta consulta.'
/** Aviso de ítem cotizable (RN-CO-02). */
export const NOTA_COTIZABLE =
  'El ítem "Sistema a medida" se cotiza por separado según el alcance y no está incluido en el total.'
/** Error que lanzan los payloads inválidos (lo captura `tryBuildPdfBlob`). */
const PAYLOAD_INVALIDO = new TypeError('pdfDocument: payload inválido')

/**
 * Derivación pura de las secciones del documento (D3). Es lo que se testea;
 * `buildPdfDocument` es una capa fina de presentación.
 *
 * Accede a `payload.submittedAt` sin defensa a propósito (D8): un payload
 * inválido revienta acá adentro y `tryBuildPdfBlob` convierte ese fallo en
 * "sin PDF" sin romper el flujo de envío.
 *
 * @param {object} payload LeadPayload (KB 04 §LeadPayload).
 * @returns {object} Secciones con filas `{ label, value }`.
 */
export function buildPdfSections(payload) {
  if (!payload || typeof payload !== 'object') throw PAYLOAD_INVALIDO
  const submittedAt = payload.submittedAt

  const isQuotable = payload.hasQuotable === true
  const quantity =
    typeof payload.quantity === 'number' &&
    Number.isFinite(payload.quantity) &&
    payload.quantity >= 1
      ? payload.quantity
      : 1
  const service = payload.service ?? null
  const extras = Array.isArray(payload.extras) ? payload.extras : []
  const contact = payload.contact ?? {}
  const { oneTime, recurring } = splitRecurring(extras)

  const serviceRows = service
    ? [
        { label: 'Tipo de sitio', value: service.name || '—' },
        ...(quantity > 1 ? [{ label: 'Cantidad', value: `× ${quantity}` }] : []),
        {
          label: 'Importe del servicio',
          value: isQuotable
            ? QUOTABLE_LABEL
            : formatARS(toAmount(service.priceARS) * quantity),
        },
      ]
    : [{ label: 'Tipo de sitio', value: '—' }]

  const oneTimeRows = oneTime.map((extra) => ({
    label: extra.name || extra.id,
    value: extraPriceLabel(extra),
  }))

  const monthlyRows = recurring.map((extra) => ({
    label: extra.name || extra.id,
    value: extraPriceLabel(extra),
  }))

  const subtotal = payload.subtotal ?? 0
  const total = payload.total ?? 0
  const monthlyTotal = recurring.reduce((sum, extra) => sum + toAmount(extra.priceARS), 0)
  const hasHosting = extras.some((extra) => extra && extra.id === 'hosting')

  const contactRows = [
    { label: 'Nombre', value: contact.name?.trim() || 'Sin nombre' },
    { label: 'Email', value: contact.email?.trim() || '—' },
    ...(contact.phone?.trim() ? [{ label: 'Teléfono', value: contact.phone.trim() }] : []),
    ...(contact.project?.trim() ? [{ label: 'Proyecto', value: contact.project.trim() }] : []),
  ]

  return {
    emisor: EMISOR,
    titulo: TITULO,
    fecha: DATE_FORMATTER.format(new Date(submittedAt)),
    fuente: payload.source || 'facucode.dev/configurador',
    serviceRows,
    oneTimeRows,
    monthlyRows,
    totals: { subtotal, total, showSubtotal: subtotal !== total, monthlyTotal, isQuotable },
    hasHosting,
    contactRows,
    notaNoVinculante: NOTA_NO_VINCULANTE,
    notaCotizable: NOTA_COTIZABLE,
    disclaimerHosting: HOSTING_DISCLAIMER,
  }
}

/* ---------------------------------------------------------------------------
 * Presentación: árbol de elementos con createElement (sin JSX).
 * ------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, lineHeight: 1.5, color: '#1a1a1a' },
  header: { marginBottom: 4 },
  headerEmisor: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#030303' },
  headerTitulo: { fontSize: 12, color: '#0a0a0a', marginTop: 2 },
  headerMeta: { fontSize: 9, color: '#555', marginTop: 4 },
  rule: { borderBottom: 1, borderBottomColor: '#00ffc3', marginBottom: 12 },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#030303',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  rowLabel: { color: '#333' },
  rowValue: { fontFamily: 'Helvetica-Bold', color: '#030303' },
  totalRow: { borderTop: 1, borderTopColor: '#ddd', paddingTop: 4, marginTop: 4 },
  totalValue: { color: '#00b389' },
  monthlyValue: { color: '#555' },
  note: { marginTop: 8, fontSize: 9, color: '#555' },
  quotableNote: { marginTop: 8, fontSize: 9, color: '#7a2d9e', fontFamily: 'Helvetica-Bold' },
  disclaimer: { marginTop: 8, fontSize: 9, color: '#555' },
})

const T = (children, style) => React.createElement(Text, { style }, children)
const V = (children, style) => React.createElement(View, { style }, children)

function Row(label, value, valueStyle) {
  return V([T(label, styles.rowLabel), T(value, valueStyle)], styles.row)
}

/**
 * Bloque con título y filas. `styleFor` (opcional) devuelve el estilo del valor
 * de cada fila; por defecto todas usan el estilo de valor estándar.
 */
function Section(title, rows, styleFor = () => styles.rowValue) {
  return V(
    [T(title, styles.sectionTitle), ...rows.map((row) => Row(row.label, row.value, styleFor(row)))],
    styles.section
  )
}

/**
 * Construye el elemento `<Document>` listo para `renderToBuffer`.
 * @param {object} payload LeadPayload.
 * @returns {import('react').ReactElement}
 */
export function buildPdfDocument(payload) {
  const s = buildPdfSections(payload)

  const totalRows = []
  if (s.totals.subtotal !== s.totals.total) totalRows.push({ label: 'Subtotal', value: formatARS(s.totals.subtotal) })
  totalRows.push({ label: 'Total', value: formatARS(s.totals.total) })
  if (s.totals.monthlyTotal > 0) {
    totalRows.push({ label: 'Mensual', value: `${formatARS(s.totals.monthlyTotal)}/mes` })
  }
  const totalStyle = (row) => (row.label === 'Mensual' ? styles.monthlyValue : styles.totalValue)

  const children = [
    V(
      [
        T(s.emisor, styles.headerEmisor),
        T(s.titulo, styles.headerTitulo),
        T(`${s.fecha} · ${s.fuente}`, styles.headerMeta),
      ],
      styles.header
    ),
    V(null, styles.rule),
    Section('Servicio', s.serviceRows),
    ...(s.oneTimeRows.length ? [Section('Extras', s.oneTimeRows)] : []),
    ...(s.monthlyRows.length ? [Section('Servicios mensuales', s.monthlyRows)] : []),
    Section('Total', totalRows, totalStyle),
    ...(s.totals.isQuotable ? [T(s.notaCotizable, styles.quotableNote)] : []),
    ...(s.hasHosting ? [T(s.disclaimerHosting, styles.disclaimer)] : []),
    Section('Contacto', s.contactRows),
    T(s.notaNoVinculante, styles.note),
  ]

  return React.createElement(
    Document,
    {
      title: 'Presupuesto web',
      author: EMISOR,
      creator: 'Configurador de Presupuestos · facucode.dev',
      producer: 'Configurador de Presupuestos',
    },
    React.createElement(Page, { size: 'A4', style: styles.page }, children)
  )
}