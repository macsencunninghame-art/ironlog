import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export interface BarDatum {
  label: string
  value: number
  /** Tooltip detail, e.g. "3 sessions". */
  detail?: string
}

interface BarChartProps {
  data: BarDatum[]
  height?: number
  suffix?: string
}

export function BarChart({ data, height = 240, suffix = 'kg' }: BarChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    if (!width || data.length === 0) return

    const margin = { top: 16, right: 8, bottom: 30, left: 44 }
    const innerW = Math.max(10, width - margin.left - margin.right)
    const innerH = Math.max(10, height - margin.top - margin.bottom)

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.28)

    const maxValue = d3.max(data, (d) => d.value) ?? 0
    const y = d3
      .scaleLinear()
      .domain([0, maxValue > 0 ? maxValue * 1.15 : 1])
      .nice()
      .range([innerH, 0])

    const gradientId = `bar-grad-${Math.random().toString(36).slice(2, 8)}`
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#FF6B18')
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#FF2D8A')

    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-innerW)
          .tickFormat((d) => {
            const n = d as number
            return n >= 1000 ? `${Number((n / 1000).toFixed(1))}t` : `${n}`
          }),
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', '#243049').attr('stroke-dasharray', '3 4'))
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#8B97B2')
          .attr('font-size', 11)
          .style('font-variant-numeric', 'tabular-nums'),
      )

    // Thin out labels so a phone-width axis never turns to mush.
    const step = Math.ceil(data.length / Math.max(3, Math.floor(innerW / 46)))
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => (i % step === 0 ? d : '')))
      .call((sel) => sel.select('.domain').attr('stroke', '#243049'))
      .call((sel) => sel.selectAll('line').remove())
      .call((sel) => sel.selectAll('text').attr('fill', '#8B97B2').attr('font-size', 10))

    const tooltip = g.append('g').style('display', 'none')
    const tipBg = tooltip
      .append('rect')
      .attr('rx', 8)
      .attr('height', 38)
      .attr('fill', '#121826')
      .attr('stroke', '#243049')
    const tipValue = tooltip
      .append('text')
      .attr('fill', '#E9EEF9')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .style('font-variant-numeric', 'tabular-nums')
    const tipDetail = tooltip.append('text').attr('fill', '#8B97B2').attr('font-size', 10)

    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.label) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', (d) => (d.value > 0 ? y(d.value) : innerH - 2))
      .attr('height', (d) => (d.value > 0 ? innerH - y(d.value) : 2))
      .attr('rx', Math.min(6, x.bandwidth() / 2))
      .attr('fill', (d) => (d.value > 0 ? `url(#${gradientId})` : '#1A2233'))
      .style('cursor', 'pointer')
      .on('pointerenter pointermove', function (_event, d) {
        const bx = (x(d.label) ?? 0) + x.bandwidth() / 2
        const by = d.value > 0 ? y(d.value) : innerH

        tooltip.style('display', null)
        tipValue.text(d.value >= 1000 ? `${Number((d.value / 1000).toFixed(2))}t` : `${Math.round(d.value)} ${suffix}`)
        tipDetail.text(d.detail ?? d.label)

        const textW = Math.max(
          tipValue.node()?.getComputedTextLength() ?? 0,
          tipDetail.node()?.getComputedTextLength() ?? 0,
        )
        const boxW = textW + 20
        const boxX = Math.min(Math.max(bx - boxW / 2, 0), innerW - boxW)
        const boxY = Math.max(by - 48, 0)

        tipBg.attr('width', boxW).attr('x', boxX).attr('y', boxY)
        tipValue.attr('x', boxX + 10).attr('y', boxY + 16)
        tipDetail.attr('x', boxX + 10).attr('y', boxY + 30)
      })
      .on('pointerleave', () => tooltip.style('display', 'none'))
  }, [data, width, height, suffix])

  return (
    <div ref={wrapRef} className="w-full">
      <svg ref={svgRef} role="img" aria-label="Weekly volume chart" />
    </div>
  )
}
