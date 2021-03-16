import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useTranslation } from 'react-i18next'
import { Fraction, JSBI, Pair } from 'libs/sdk/src'
import { ChevronUp, ChevronDown } from 'react-feather'

import { ButtonEmpty } from 'components/Button'
import FavoriteStar from 'components/Icons/FavoriteStar'
import AddCircle from 'components/Icons/AddCircle'
import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import CopyHelper from 'components/Copy'
import { shortenAddress, formattedNum } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { currencyId } from 'utils/currencyId'
import { getHealthFactor } from 'utils/dmm'

const DEFAULT_MY_LIQUIDITY = '--/--'

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: repeat(8, 1fr) 0.25fr;
  grid-template-areas: 'pool ratio liq vol';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.evenRow};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`

const TableRow = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: repeat(8, 1fr) 0.25fr;
  grid-template-areas: 'pool ratio liq vol';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: flex-start;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme, oddRow }) => (oddRow ? theme.oddRow : theme.evenRow)};
  border: 1px solid transparent;

  &:hover {
    border: 1px solid #4a636f;
  }
`

const ClickableText = styled(Text)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.text6};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

const LoadMoreButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.oddRow};
  font-size: 12px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`

interface SubgraphPoolData {
  id: string
  reserveUSD: string
  volumeUSD: string
  feeUSD: string
}

interface UserLiquidityPosition {
  id: string
  liquidityTokenBalance: string
  liquidityTokenTotalSupply: string
  reserveUSD: string
  timestamp: number
  pool: {
    id: string
  }
}

interface PoolDayData {
  poolAddress: string
  dailyFeeUSD: string
}

interface ListItemProps {
  pool: Pair
  subgraphPoolData: SubgraphPoolData
  myLiquidity?: UserLiquidityPosition
  poolDayData?: PoolDayData
  oddRow?: boolean
}

const getOneYearFL = (liquidity: string, feeOneDay?: string): number => {
  return !feeOneDay || parseFloat(liquidity) === 0 ? 0 : (parseFloat(feeOneDay) * 365 * 100) / parseFloat(liquidity)
}

const getMyLiquidity = (liquidityPosition?: UserLiquidityPosition): string | 0 => {
  if (!liquidityPosition || parseFloat(liquidityPosition.liquidityTokenTotalSupply) === 0) {
    return DEFAULT_MY_LIQUIDITY
  }

  const myLiquidity =
    (parseFloat(liquidityPosition.liquidityTokenBalance) * parseFloat(liquidityPosition.reserveUSD)) /
    parseFloat(liquidityPosition.liquidityTokenTotalSupply)

  if (myLiquidity === 0) {
    return DEFAULT_MY_LIQUIDITY
  }

  return formattedNum(myLiquidity.toString(), true)
}

const ListItem = ({ pool, subgraphPoolData, myLiquidity, poolDayData, oddRow }: ListItemProps) => {
  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  // Recommended pools are pools that have AMP = 1 or is registered by kyber DAO in a whitelist contract
  // TODO: Add recommended pool which is registered by kyber DAO  in a whitelist contract
  const isRecommended = amp.equalTo(new Fraction(JSBI.BigInt(1)))

  const percentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
        .toSignificant(2) ?? '.'
    : '50%'
  const percentToken1 = pool
    ? new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0).toSignificant(2) ?? '.'
    : '50%'
  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pool?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pool.token0)
  const currency1 = unwrappedToken(pool.token1)

  const oneYearFL = getOneYearFL(subgraphPoolData.reserveUSD, poolDayData?.dailyFeeUSD).toFixed(2)

  return (
    <TableRow oddRow={oddRow}>
      {isRecommended && (
        <div style={{ position: 'absolute' }}>
          <FavoriteStar />
        </div>
      )}
      <DataText grid-area="pool">
        <PoolAddressContainer>
          {shortenPoolAddress}
          <CopyHelper toCopy={pool.address} />
        </PoolAddressContainer>
      </DataText>
      <DataText grid-area="ratio">
        <div>{`• ${percentToken0}% ${pool.token0.symbol}`}</div>
        <div>{`• ${percentToken1}% ${pool.token1.symbol}`}</div>
      </DataText>
      <DataText grid-area="liq">{formattedNum(subgraphPoolData.reserveUSD, true)}</DataText>
      <DataText grid-area="vol">{formattedNum(subgraphPoolData.volumeUSD, true)}</DataText>
      <DataText>
        {poolDayData?.dailyFeeUSD ? formattedNum(poolDayData.dailyFeeUSD, true) : formattedNum('0', true)}
      </DataText>
      <DataText>{formattedNum(amp.toSignificant(5))}</DataText>
      <DataText>{`${oneYearFL}%`}</DataText>
      <DataText>{getMyLiquidity(myLiquidity)}</DataText>
      <DataText>
        {
          <ButtonEmpty
            padding="0"
            as={Link}
            to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${pool.address}`}
            width="fit-content"
          >
            <AddCircle />
          </ButtonEmpty>
        }
      </DataText>
    </TableRow>
  )
}

interface PoolListProps {
  poolsList: (Pair | null)[]
  subgraphPoolsData: SubgraphPoolData[]
  userLiquidityPositions: UserLiquidityPosition[]
  poolDayData: PoolDayData[]
  maxItems?: number
}

const SORT_FIELD = {
  NONE: -1,
  LIQ: 0,
  VOL: 1,
  FEES: 2,
  ONE_YEAR_FL: 3
}

const PoolList = ({
  poolsList,
  subgraphPoolsData,
  userLiquidityPositions,
  poolDayData,
  maxItems = 10
}: PoolListProps) => {
  const { t } = useTranslation()

  const transformedSubgraphPoolsData: {
    [key: string]: SubgraphPoolData
  } = {}

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  const transformedPoolDayData: {
    [key: string]: PoolDayData
  } = {}

  subgraphPoolsData.forEach(data => {
    transformedSubgraphPoolsData[data.id] = data
  })

  userLiquidityPositions.forEach(position => {
    if (
      !transformedUserLiquidityPositions[position.pool.id] ||
      position.timestamp > transformedUserLiquidityPositions[position.pool.id].timestamp
    ) {
      transformedUserLiquidityPositions[position.pool.id] = position
    }
  })

  poolDayData.forEach(record => {
    transformedPoolDayData[record.poolAddress] = record
  })

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  const ITEMS_PER_PAGE = maxItems

  // sorting
  const [sortDirection, setSortDirection] = useState(true)
  const [sortedColumn, setSortedColumn] = useState(SORT_FIELD.NONE)

  const sortList = (poolA: Pair | null, poolB: Pair | null): number => {
    if (sortedColumn === SORT_FIELD.NONE) {
      if (!poolA) {
        return 1
      }

      if (!poolB) {
        return -1
      }

      // Pool with AMP = 1 will be on top
      // AMP from contract is 10000 (real value is 1)
      if (JSBI.equal(poolA.amp, JSBI.BigInt(10000))) {
        return -1
      }

      if (JSBI.equal(poolB.amp, JSBI.BigInt(10000))) {
        return 1
      }

      const poolAHealthFactor = getHealthFactor(poolA)
      const poolBHealthFactor = getHealthFactor(poolB)

      // Pool with better health factor will be prioritized higher
      if (poolAHealthFactor.greaterThan(poolBHealthFactor)) {
        return -1
      }

      if (poolAHealthFactor.lessThan(poolBHealthFactor)) {
        return 1
      }

      return 0
    }

    switch (sortedColumn) {
      case SORT_FIELD.LIQ:
        return parseFloat(transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]?.reserveUSD) >
          parseFloat(transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]?.reserveUSD)
          ? (sortDirection ? -1 : 1) * 1
          : (sortDirection ? -1 : 1) * -1
      case SORT_FIELD.VOL:
        return parseFloat(transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]?.volumeUSD) >
          parseFloat(transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]?.volumeUSD)
          ? (sortDirection ? -1 : 1) * 1
          : (sortDirection ? -1 : 1) * -1
      case SORT_FIELD.FEES:
        return parseFloat(transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]?.feeUSD) >
          parseFloat(transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]?.feeUSD)
          ? (sortDirection ? -1 : 1) * 1
          : (sortDirection ? -1 : 1) * -1
      case SORT_FIELD.ONE_YEAR_FL:
        const oneYearFLPoolA = getOneYearFL(
          transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]?.reserveUSD,
          transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]?.feeUSD
        )

        const oneYearFLPoolB = getOneYearFL(
          transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]?.reserveUSD,
          transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]?.feeUSD
        )

        return oneYearFLPoolA > oneYearFLPoolB ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
      default:
        break
    }

    return 0
  }

  useEffect(() => {
    setMaxPage(1) // edit this to do modular
    setPage(1)
  }, [poolsList])

  const pools = useMemo(() => {
    return poolsList
      .map(pair => pair) // Clone to a new array to prevent "in-place" sort that mutate the poolsList
      .sort(sortList)
  }, [poolsList, sortedColumn, sortDirection])

  useEffect(() => {
    if (poolsList) {
      let extraPages = 1
      if (Object.keys(poolsList).length % ITEMS_PER_PAGE === 0) {
        extraPages = 0
      }
      setMaxPage(Math.floor(Object.keys(poolsList).length / ITEMS_PER_PAGE) + extraPages)
    }
  }, [ITEMS_PER_PAGE, poolsList])

  return (
    <div>
      <TableHeader>
        <Flex alignItems="center" justifyContent="flexStart">
          <ClickableText>Pool</ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>Ratio</ClickableText>
          <InfoHelper text={'Based on 24hr volume annualized'} />
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.LIQ)
              setSortDirection(sortedColumn !== SORT_FIELD.LIQ ? true : !sortDirection)
            }}
          >
            Liquidity
            {sortedColumn === SORT_FIELD.LIQ ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.VOL)
              setSortDirection(sortedColumn !== SORT_FIELD.VOL ? true : !sortDirection)
            }}
          >
            Volume
            {sortedColumn === SORT_FIELD.VOL ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.FEES)
              setSortDirection(sortedColumn !== SORT_FIELD.FEES ? true : !sortDirection)
            }}
          >
            Fee (24h)
            {sortedColumn === SORT_FIELD.FEES ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>AMP</ClickableText>
          <InfoHelper text={'Based on 24hr volume annualized'} />
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.ONE_YEAR_FL)
              setSortDirection(sortedColumn !== SORT_FIELD.ONE_YEAR_FL ? true : !sortDirection)
            }}
          >
            1y F/L
            {sortedColumn === SORT_FIELD.ONE_YEAR_FL ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>My liquidity</ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd" />
      </TableHeader>
      {!subgraphPoolsData ? (
        <LocalLoader />
      ) : (
        pools.slice(0, page * ITEMS_PER_PAGE).map((pool, index) => {
          if (pool) {
            return (
              <ListItem
                key={pool.address}
                pool={pool}
                subgraphPoolData={transformedSubgraphPoolsData[pool.address.toLowerCase()]}
                myLiquidity={transformedUserLiquidityPositions[pool.address.toLowerCase()]}
                poolDayData={transformedPoolDayData[pool.address.toLowerCase()]}
                oddRow={(index + 1) % 2 !== 0}
              />
            )
          }

          return null
        })
      )}
      <LoadMoreButtonContainer>
        <ButtonEmpty
          onClick={() => {
            setPage(page === maxPage ? page : page + 1)
          }}
          disabled={page >= maxPage}
        >
          {t('showMorePools')}
        </ButtonEmpty>
      </LoadMoreButtonContainer>
    </div>
  )
}

export default PoolList
