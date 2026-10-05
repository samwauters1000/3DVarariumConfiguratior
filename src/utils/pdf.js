import { formatPrice } from './pricing.js'
import { formatDate } from './summary.js'
import { flattenToJpeg } from './image.js'

// Colours from the design tokens, as RGB for jsPDF.
const COLORS = {
  background: [224, 229, 206],
  panel: [243, 244, 236],
  primary: [162, 175, 158],
  text: [45, 53, 41],
  muted: [107, 117, 100],
  line: [200, 205, 190],
}

const PAGE = { width: 210, height: 297, margin: 20 }
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2

// Builds and downloads a PDF of the confirmed configuration.
export async function exportConfigurationPdf(summary) {
  // jsPDF is only loaded when the user actually exports.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const right = PAGE.width - PAGE.margin
  let y = 0

  const ensureSpace = (needed) => {
    if (y + needed <= PAGE.height - 24) return
    doc.addPage()
    y = PAGE.margin
  }

  // Header band
  doc.setFillColor(...COLORS.background)
  doc.rect(0, 0, PAGE.width, 44, 'F')
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Terrarium configuration', PAGE.margin, 22)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Reference ${summary.reference}`, PAGE.margin, 32)
  doc.text(formatDate(summary.createdAt), right, 32, { align: 'right' })
  y = 56

  // Preview image
  if (summary.previewImage) {
    const boxHeight = 88
    doc.setFillColor(...COLORS.panel)
    doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, boxHeight, 4, 4, 'F')
    const { src, width, height } = await flattenToJpeg(summary.previewImage, {
      background: `rgb(${COLORS.panel.join(',')})`,
    })
    const scale = Math.min((CONTENT_WIDTH - 8) / width, (boxHeight - 8) / height)
    const imageWidth = width * scale
    const imageHeight = height * scale
    doc.addImage(src, 'JPEG', PAGE.margin + (CONTENT_WIDTH - imageWidth) / 2, y + (boxHeight - imageHeight) / 2, imageWidth, imageHeight)
    y += boxHeight + 14
  }

  // Line items
  for (const section of summary.sections) {
    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(section.label.toUpperCase(), PAGE.margin, y, { charSpace: 0.4 })
    y += 7

    for (const line of section.lines) {
      ensureSpace(10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(...COLORS.text)
      const name = line.quantity > 1 ? `${line.name}  × ${line.quantity}` : line.name
      doc.text(name, PAGE.margin, y)
      if (line.quantity > 1) {
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(`${formatPrice(line.unitPrice)} each`, right - 32, y, { align: 'right' })
        doc.setFontSize(11)
        doc.setTextColor(...COLORS.text)
      }
      doc.setFont('helvetica', 'bold')
      doc.text(formatPrice(line.total), right, y, { align: 'right' })
      y += 3.5
      doc.setDrawColor(...COLORS.line)
      doc.setLineDashPattern([0.8, 0.8], 0)
      doc.line(PAGE.margin, y, right, y)
      doc.setLineDashPattern([], 0)
      y += 6.5
    }
    y += 4
  }

  // Total
  ensureSpace(20)
  doc.setDrawColor(...COLORS.text)
  doc.setLineWidth(0.6)
  doc.line(PAGE.margin, y, right, y)
  doc.setLineWidth(0.2)
  y += 9
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...COLORS.text)
  doc.text('Total', PAGE.margin, y)
  doc.text(formatPrice(summary.total), right, y, { align: 'right' })

  // Care sheet on its own page: how to look after every plant and animal.
  const careSheet = summary.careSheet ?? []
  const careWarnings = summary.careWarnings ?? []
  if (careSheet.length > 0 || careWarnings.length > 0) {
    doc.addPage()
    doc.setFillColor(...COLORS.background)
    doc.rect(0, 0, PAGE.width, 34, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...COLORS.text)
    doc.text('Care sheet', PAGE.margin, 21)
    y = 48

    if (careWarnings.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.muted)
      doc.text('THINGS TO CHECK', PAGE.margin, y, { charSpace: 0.4 })
      y += 7
      for (const warning of careWarnings) {
        doc.setFont('helvetica', warning.tone === 'warning' ? 'bold' : 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...COLORS.text)
        const lines = doc.splitTextToSize(warning.text, CONTENT_WIDTH - 6)
        ensureSpace(lines.length * 5 + 3)
        doc.text('•', PAGE.margin, y)
        doc.text(lines, PAGE.margin + 5, y)
        y += lines.length * 5 + 2
      }
      y += 6
    }

    for (const categoryId of ['plants', 'animals']) {
      const entries = careSheet.filter((entry) => entry.categoryId === categoryId)
      if (entries.length === 0) continue
      ensureSpace(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.muted)
      doc.text(categoryId.toUpperCase(), PAGE.margin, y, { charSpace: 0.4 })
      y += 7
      for (const entry of entries) {
        const tipLines = doc.splitTextToSize(entry.tip, CONTENT_WIDTH)
        ensureSpace(14 + tipLines.length * 4.5)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...COLORS.text)
        doc.text(entry.name, PAGE.margin, y)
        y += 5.5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(entry.facts.map(([label, value]) => `${label}: ${value}`).join('   ·   '), PAGE.margin, y)
        y += 5
        doc.setTextColor(...COLORS.text)
        doc.text(tipLines, PAGE.margin, y)
        y += tipLines.length * 4.5 + 1
        doc.setDrawColor(...COLORS.line)
        doc.setLineDashPattern([0.8, 0.8], 0)
        doc.line(PAGE.margin, y, right, y)
        doc.setLineDashPattern([], 0)
        y += 6
      }
      y += 3
    }
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text('Created with the Vararium Configurator', PAGE.margin, PAGE.height - 12)
    doc.text(`Page ${page} of ${pageCount}`, right, PAGE.height - 12, { align: 'right' })
  }

  doc.save(`terrarium-configuration-${summary.reference}.pdf`)
}
