import { Trans, t } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { useState } from 'react'
import { PieChart, pieChartDefaultProps } from 'react-minimal-pie-chart'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { Loading } from 'pages/ProAmmPool/ContentLoader'

const formatUSDValue = (v: string) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })

  return formatter.format(Number(v))
}

const LegendsWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 16px;
`

const LoadingSkeletonForLegends = () => {
  return (
    <LegendsWrapper>
      {Array(3)
        .fill(0)
        .map((_, i) => {
          return (
            <Flex
              key={i}
              sx={{
                alignItems: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              {Array(2)
                .fill(0)
                .map((_, j) => {
                  return (
                    <Loading
                      key={j}
                      style={{
                        flex: '0 1 50%',
                        height: '24px',
                        borderRadius: '4px',
                      }}
                    />
                  )
                })}
            </Flex>
          )
        })}
    </LegendsWrapper>
  )
}

type LegendProps = {
  color: string
  label: string
  value: string
  percent: number
  active?: boolean

  onMouseOver: () => void
  onMouseOut: () => void
}
const Legend: React.FC<LegendProps> = ({ color, label, value, percent, active, onMouseOut, onMouseOver }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        flex: '1 0 fit-content',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        borderRadius: '4px',
        background: active ? rgba(theme.text4, 0.6) : undefined,
        cursor: 'pointer',
        transition: 'all .3s',
      }}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
    >
      <Flex
        sx={{
          width: '12px',
          height: '12px',
          borderRadius: '999px',
          background: color,
        }}
      />

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.text,
        }}
      >
        {label}:
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
          whiteSpace: 'nowrap',
        }}
      >
        {formatUSDValue(value)} ({percent.toFixed(2)}%)
      </Text>
    </Flex>
  )
}

const COLORS = [
  '#7C8FF3',
  '#FDA946',
  '#FF50F8',
  '#0086E7',
  '#FF9901',
  '#3EC000',
  '#F67272',
  '#9b59b6',
  '#e67e22',
  '#c0392b',
]

type DataEntry = {
  title: string
  value: string
  percent: number
}

type Props = {
  className?: string

  isLoading?: boolean
  totalValue?: string
  data?: DataEntry[]
}

const EmptyData: DataEntry[] = [
  {
    title: 'loading',
    value: t`loading...`,
    percent: 100,
  },
]

const EarningPieChart: React.FC<Props> = ({ data = EmptyData, totalValue = '', className, isLoading = false }) => {
  const [hovered, setHovered] = useState<number | undefined>(undefined)

  const chartData = data.map((entry, i) => {
    const color = hovered === i ? darken(0.3, COLORS[i]) : COLORS[i]

    return {
      title: entry.title,
      value: entry.percent,
      color,
    }
  })

  const legendData = data.map((entry, i) => {
    return {
      ...entry,
      color: COLORS[i],
    }
  })

  return (
    <Flex
      className={className}
      sx={{
        flexDirection: 'column',
      }}
    >
      <Flex
        sx={{
          width: '100%',
          position: 'relative',
        }}
      >
        <PieChart
          data={chartData}
          lineWidth={20}
          radius={pieChartDefaultProps.radius - 10}
          segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
          paddingAngle={isLoading ? 0 : 1}
          onMouseOver={(_, index) => {
            setHovered(index)
          }}
          onMouseOut={() => {
            setHovered(undefined)
          }}
        />

        <Text
          as="span"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate3d(-50%, -50%, 0)',
            fontWeight: 500,
            fontSize: '24px',
            lineHeight: '28px',
          }}
        >
          {isLoading ? <Trans>loading...</Trans> : totalValue}
        </Text>
      </Flex>

      {isLoading ? (
        <LoadingSkeletonForLegends />
      ) : (
        <LegendsWrapper>
          {legendData.map((entry, i) => {
            return (
              <Legend
                active={hovered === i}
                key={i}
                color={entry.color}
                label={entry.title}
                value={entry.value}
                percent={entry.percent}
                onMouseOver={() => setHovered(i)}
                onMouseOut={() => setHovered(undefined)}
              />
            )
          })}
        </LegendsWrapper>
      )}
    </Flex>
  )
}

export default EarningPieChart
