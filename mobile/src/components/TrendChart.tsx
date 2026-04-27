import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { InsightsSummary } from '../mocks/apiLogic'
import { colors } from '../theme'

const VB_H = 120
const W_BASE = 500

type Series = InsightsSummary['netWorthSeries']

function buildPath(series: Series) {
  if (series.length < 2) return null
  const minV = Math.min(...series.map((p) => p.value))
  const maxV = Math.max(...series.map((p) => p.value))
  const pad = (maxV - minV) * 0.15 || 1
  const lo = minV - pad
  const hi = maxV + pad
  const xn = (i: number) => (i / (series.length - 1)) * W_BASE
  const yv = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100
  const line = series
    .map(
      (p, i) => `${i === 0 ? 'M' : 'L'}${xn(i).toFixed(1)} ${yv(p.value).toFixed(1)}`,
    )
    .join(' ')
  return {
    fill: `${line} L ${W_BASE} ${VB_H} L 0 ${VB_H} Z`,
    line,
  }
}

export function TrendChart({ series }: { series: Series }) {
  const paths = useMemo(() => buildPath(series), [series])
  if (paths == null) return null
  return (
    <View style={styles.box}>
      <Svg
        width="100%"
        height={100}
        viewBox={`0 0 ${W_BASE} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={styles.svg}
      >
        <Path d={paths.fill} fill={colors.fill} />
        <Path
          d={paths.line}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    maxHeight: 120,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 8,
  },
  svg: { width: '100%' },
})
