import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export interface LinePoint {
  date: Date
  value: number
  /** Extra detail for the tooltip, e.g. "60 kg x 8". */
  detail?: string
}

interface LineChartProps {
  points: LinePoint[]
  height?: number
  color?: string
  suffix?: string
  /** Compact mode for the dashboard mini chart: no axes, no dots. */
  minimal?: boolean
  /** Renders the axis ticks and tooltip value, for units that are not plain numbers (times). */
  format?: (value: number) => string
}

export function LineChart({
  points,
  height = 240,
  color = '#FF6B18',
  suffix = 'kg',
  minimal = false,
  format,
}: LineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    if (!width || points.length === 0) return

    const margin = minimal
      ? { top: 10, right: 8, bottom: 10, left: 8 }
      : { top: 16, right: 16, bottom: 28, left: 44 }
    const innerW = Math.max(10, width - margin.left - margin.right)
    const innerH = Math.max(10, height - margin.top - margin.bottom)

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // A single point has no extent, so pad the domain to keep the line visible.
    const dates = points.map((p) => p.date)
    const xDomain: [Date, Date] =
      points.length === 1
        ? [d3.timeDay.offset(dates[0], -3), d3.timeDay.offset(dates[0], 3)]
        : (d3.extent(dates) as [Date, Date])

    const values = points.map((p) => p.value)
    const vMin = d3.min(values) ?? 0
    const vMax = d3.max(values) ?? 1
    const pad = Math.max((vMax - vMin) * 0.18, vMax * 0.06, 1)

    const x = d3.scaleTime().domain(xDomain).range([0, innerW])
    const y = d3
      .scaleLinear()
      .domain([Math.max(0, vMin - pad), vMax + pad])
      .nice()
      .range([innerH, 0])

    const gradientId = `line-grad-${Math.random().toString(36).slice(2, 8)}`
    const defs = svg.append('defs')
    const gradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.35)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0)

    if (!minimal) {
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickSize(-innerW)
            .tickFormat(() => ''),
        )
        .call((sel) => sel.select('.domain').remove())
        .call((sel) => sel.selectAll('line').attr('stroke', '#243049').attr('stroke-dasharray', '3 4'))

      g.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat((d) => (format ? format(d as number) : `${d}`)))
        .call((sel) => sel.select('.domain').remove())
        .call((sel) => sel.selectAll('line').remove())
        .call((sel) =>
          sel
            .selectAll('text')
            .attr('fill', '#8B97B2')
            .attr('font-size', 11)
            .style('font-variant-numeric', 'tabular-nums'),
        )

      const tickCount = Math.min(points.length, Math.max(2, Math.floor(innerW / 78)))
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(tickCount)
            .tickFormat((d) => d3.timeFormat('%-d %b')(d as Date)),
        )
        .call((sel) => sel.select('.domain').attr('stroke', '#243049'))
        .call((sel) => sel.selectAll('line').attr('stroke', '#243049'))
        .call((sel) => sel.selectAll('text').attr('fill', '#8B97B2').attr('font-size', 11))
    }

    const area = d3
      .area<LinePoint>()
      .x((d) => x(d.date))
      .y0(innerH)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX)

    const line = d3
      .line<LinePoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path').datum(points).attr('fill', `url(#${gradientId})`).attr('d', area)

    g.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', minimal ? 2.5 : 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line)

    if (!minimal) {
      g.selectAll('.dot')
        .data(points)
        .join('circle')
        .attr('cx', (d) => x(d.date))
        .attr('cy', (d) => y(d.value))
        .attr('r', 4.5)
        .attr('fill', '#0B0F1A')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
    } else {
      const last = points[points.length - 1]
      g.append('circle')
        .attr('cx', x(last.date))
        .attr('cy', y(last.value))
        .attr('r', 4)
        .attr('fill', color)
    }

    if (minimal) return

    // Hover readout: a guide line, a highlighted dot and a floating label.
    const focus = g.append('g').style('display', 'none')
    focus
      .append('line')
      .attr('class', 'focus-line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.6)
    focus.append('circle').attr('r', 6).attr('fill', color).attr('stroke', '#0B0F1A').attr('stroke-width', 2.5)

    const label = focus.append('g')
    const labelBg = label
      .append('rect')
      .attr('rx', 8)
      .attr('fill', '#121826')
      .attr('stroke', '#243049')
      .attr('height', 40)
    const labelValue = label
      .append('text')
      .attr('fill', '#E9EEF9')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .style('font-variant-numeric', 'tabular-nums')
    const labelDate = label.append('text').attr('fill', '#8B97B2').attr('font-size', 10)

    const bisect = d3.bisector<LinePoint, Date>((d) => d.date).center

    svg
      .append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('touch-action', 'none')
      .on('pointerenter pointermove', (event: PointerEvent) => {
        const [mx] = d3.pointer(event)
        const index = bisect(points, x.invert(mx))
        const point = points[index]
        if (!point) return

        focus.style('display', null)
        const px = x(point.date)
        const py = y(point.value)
        focus.select('.focus-line').attr('transform', `translate(${px},0)`)
        focus.select('circle').attr('cx', px).attr('cy', py)

        labelValue.text(format ? format(point.value) : `${Number(point.value.toFixed(1))} ${suffix}`)
        labelDate.text(point.detail ?? d3.timeFormat('%-d %b %Y')(point.date))

        const textW = Math.max(
          (labelValue.node()?.getComputedTextLength() ?? 0),
          (labelDate.node()?.getComputedTextLength() ?? 0),
        )
        const boxW = textW + 20
        const boxX = Math.min(Math.max(px - boxW / 2, 0), innerW - boxW)
        const boxY = Math.max(py - 52, 0)

        labelBg.attr('width', boxW).attr('x', boxX).attr('y', boxY)
        labelValue.attr('x', boxX + 10).attr('y', boxY + 17)
        labelDate.attr('x', boxX + 10).attr('y', boxY + 31)
      })
      .on('pointerleave', () => focus.style('display', 'none'))
  }, [points, width, height, color, suffix, minimal, format])

  return (
    <div ref={wrapRef} className="w-full">
      <svg ref={svgRef} role="img" aria-label="Progression chart" />
    </div>
  )
}
