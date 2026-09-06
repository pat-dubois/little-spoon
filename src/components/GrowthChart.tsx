import { useEffect, useId, useRef, useState } from 'react'
import type { getGrowthChart } from '../clinical/growth'
import { formatNumber, SourceLinks } from './ui'

type ChartData = NonNullable<ReturnType<typeof getGrowthChart>>

export function GrowthChart({ data, label, zScore }: { data: ChartData; label: string; zScore?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(736)
  const titleId = useId()
  const descriptionId = useId()
  const clipId = useId().replace(/:/g, '')
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(220, entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const points = data.curves.flatMap((curve) => curve.points).concat(data.trackingCurve, data.childPoint ? [data.childPoint] : [])
  if (!points.length) return null
  const xMin = Math.min(...points.map((point) => point.x))
  const xMax = Math.max(...points.map((point) => point.x))
  const rawYMin = Math.min(...points.map((point) => point.y))
  const rawYMax = Math.max(...points.map((point) => point.y))
  const yRange = Math.max(rawYMax - rawYMin, 1)
  const yMin = Math.max(0, rawYMin - yRange * 0.08)
  const yMax = rawYMax + yRange * 0.1
  const compact = width < 500
  const plot = { left: compact ? 43 : 57, top: 23, width: width - (compact ? 79 : 116), height: compact ? 226 : 284 }
  const chartHeight = plot.top + plot.height + 60
  const x = (value: number) => plot.left + (value - xMin) / Math.max(xMax - xMin, 1) * plot.width
  const y = (value: number) => plot.top + plot.height - (value - yMin) / (yMax - yMin) * plot.height
  const path = (line: { x: number; y: number }[]) => line.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`).join(' ')
  const xTicks = Array.from({ length: 6 }, (_, index) => xMin + (xMax - xMin) * index / 5)
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (yMax - yMin) * index / 4)
  return <div className="chart-content" ref={containerRef}>
    <div className="chart-heading"><div><h3>{label}</h3><p>{data.yLabel}</p></div><span className="chart-reference">WHO reference</span></div>
    <svg className="growth-chart" viewBox={`0 0 ${width} ${chartHeight}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{label} growth reference chart</title>
      <desc id={descriptionId}>WHO reference curves labeled by z-score. {data.childPoint ? `Patient measurement: ${formatNumber(data.childPoint.y, 2)} at ${formatNumber(data.childPoint.x, 2)} on the ${data.xLabel} axis. Z-score ${zScore?.toFixed(2)}.` : ''} A dotted curve, when present, follows the same z-score as a reference comparison. It is not a growth prediction.</desc>
      <defs><clipPath id={clipId}><rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} /></clipPath></defs>
      {yTicks.map((tick) => <g key={tick}><line className="chart-gridline" x1={plot.left} x2={plot.left + plot.width} y1={y(tick)} y2={y(tick)} /><text className="chart-tick" x={plot.left - 12} y={y(tick) + 4} textAnchor="end">{formatNumber(tick, 1)}</text></g>)}
      {xTicks.map((tick) => <g key={tick}><line className="chart-gridline chart-gridline-vertical" x1={x(tick)} x2={x(tick)} y1={plot.top} y2={plot.top + plot.height} /><text className="chart-tick" x={x(tick)} y={plot.top + plot.height + 23} textAnchor="middle">{formatNumber(tick, 1)}</text></g>)}
      <g clipPath={`url(#${clipId})`}>{data.curves.map((curve) => <path className={`chart-curve${curve.zScore === 0 ? ' chart-median' : ''}`} key={curve.zScore} d={path(curve.points)} fill="none" />)}
      {data.trackingCurve.length > 0 && <path className="chart-tracking" d={path(data.trackingCurve)} fill="none" />}
      </g>
      {data.curves.map((curve) => { const last = curve.points[curve.points.length - 1]; return last ? <text key={curve.zScore} className={`chart-curve-label${curve.zScore === 0 ? ' chart-median-label' : ''}`} x={x(last.x) + 10} y={y(last.y) + 4}>{curve.zScore > 0 ? '+' : ''}{curve.zScore}</text> : null })}
      {data.childPoint && <g className="chart-child"><circle className="chart-point-halo" cx={x(data.childPoint.x)} cy={y(data.childPoint.y)} r="9" /><circle className="chart-point" cx={x(data.childPoint.x)} cy={y(data.childPoint.y)} r="5" /></g>}
      <text className="chart-axis-title" x={plot.left + plot.width / 2} y={chartHeight - 9} textAnchor="middle">{data.xLabel}</text>
    </svg>
    <div className="chart-legend"><span><i className="legend-line" />WHO z-score curves</span><span><i className="legend-point" />Patient measurement</span>{data.trackingCurve.length > 0 && <span><i className="legend-dotted" />Same z-score</span>}</div>
    {data.notes.map((note, index) => <p className="chart-note" key={index}>{note}</p>)}
    <SourceLinks sources={[data.source]} />
  </div>
}
