/**
 * Documento PDF de la solicitud (C-09).
 *
 * Construye el documento de `@react-pdf/renderer` a partir del `LeadPayload`
 * (KB 04). Está escrito **sin JSX** (`createElement`) a propósito: Node no
 * transforma JSX y el módulo debe poder importarse desde `node:test` tal cual.
 *
 * La generación real ocurre en `pdfGenerator.js` (import dinámico, best-effort
 * RN-PD-03 y conversión a base64). Este módulo solo define el documento y un
 * modelo de secciones puro y testeable: `buildPdfSections`.
 *
 * El configurador no publica precios: el documento resume la selección (tipo de
 * sitio, cantidad, extras) y los datos de contacto. Aplica el disclaimer de
 * hosting si se incluyó (RN-HD-02/03).
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

import { HOSTING_DISCLAIMER } from '../data/configurador.js'

/** Formateador de fecha es-AR (mismo idioma de la UI). */
const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' })

/** Textos fijos del documento. */
const EMISOR = 'Facundo Chacón'
const TITULO = 'Solicitud de presupuesto'
/** Nota de la solicitud: el precio se confirma por email. */
export const NOTA_SOLICITUD =
  'Gracias por tu solicitud. Te voy a responder por email con una propuesta a medida, sin cargo y sin compromiso.'
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

  const quantity =
    typeof payload.quantity === 'number' &&
    Number.isFinite(payload.quantity) &&
    payload.quantity >= 1
      ? payload.quantity
      : 1
  const service = payload.service ?? null
  const extras = Array.isArray(payload.extras) ? payload.extras : []
  const contact = payload.contact ?? {}

  const serviceRows = service
    ? [
        { label: 'Tipo de sitio', value: service.name || '—' },
        ...(quantity > 1 ? [{ label: 'Cantidad', value: `× ${quantity}` }] : []),
      ]
    : [{ label: 'Tipo de sitio', value: '—' }]

  const extraNames = extras.map((extra) => extra.name || extra.id)
  const extrasRows = [
    { label: 'Seleccionados', value: extraNames.length > 0 ? extraNames.join(', ') : 'Sin extras' },
  ]

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
    extrasRows,
    hasHosting,
    contactRows,
    notaSolicitud: NOTA_SOLICITUD,
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
  note: { marginTop: 8, fontSize: 9, color: '#555' },
  disclaimer: { marginTop: 8, fontSize: 9, color: '#555' },
})

const T = (children, style) => React.createElement(Text, { style }, children)
const V = (children, style) => React.createElement(View, { style }, children)

function Row(label, value) {
  return V([T(label, styles.rowLabel), T(value, styles.rowValue)], styles.row)
}

/**
 * Bloque con título y filas.
 */
function Section(title, rows) {
  return V([T(title, styles.sectionTitle), ...rows.map((row) => Row(row.label, row.value))], styles.section)
}

/**
 * Construye el elemento `<Document>` listo para `renderToBuffer`.
 * @param {object} payload LeadPayload.
 * @returns {import('react').ReactElement}
 */
export function buildPdfDocument(payload) {
  const s = buildPdfSections(payload)

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
    Section('Extras', s.extrasRows),
    ...(s.hasHosting ? [T(s.disclaimerHosting, styles.disclaimer)] : []),
    Section('Contacto', s.contactRows),
    T(s.notaSolicitud, styles.note),
  ]

  return React.createElement(
    Document,
    {
      title: 'Solicitud de presupuesto',
      author: EMISOR,
      creator: 'Configurador web · facucode.dev',
      producer: 'Configurador web',
    },
    React.createElement(Page, { size: 'A4', style: styles.page }, children)
  )
}
