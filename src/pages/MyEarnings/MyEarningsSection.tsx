import { useMemo } from 'react'
import { Flex } from 'rebass'

import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useGetEarningsBreakdown from 'hooks/myEarnings/useGetEarningsBreakdown'
import useGetEarningsOverTime from 'hooks/myEarnings/useGetEarningsOverTime'
import useGetPositionEarnings from 'hooks/myEarnings/useGetPositionEarnings'
import { EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'
import { toCurrencyAmount } from 'utils/currencyAmount'

import EarningsBreakdownPanel from './EarningsBreakdownPanel'
import MyEarningsOverTimePanel from './MyEarningsOverTimePanel'

const MyEarningsSection = () => {
  const { chainId } = useActiveWeb3React()
  const earningsBreakdownState = useGetEarningsBreakdown()
  const earningsOverTimeState = useGetEarningsOverTime()

  // TODO: chainId is missing in response
  const positionEarningsState = useGetPositionEarnings()
  const allTokens = useAllTokens()

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    const latestData = positionEarningsState.data?.data?.groupByAccount
      ?.slice(-1)[0]
      .total?.filter(tokenData => {
        const tokenAddress = isAddress(chainId, tokenData.token)
        if (!tokenAddress) {
          return false
        }

        const currency = allTokens[tokenAddress]
        return !!currency
      })
      .map(tokenData => {
        const tokenAddress = isAddress(chainId, tokenData.token)
        const currency = allTokens[String(tokenAddress)]
        const amount = toCurrencyAmount(currency, tokenData.amount)
        return {
          amount,
          amountUSD: Number(tokenData.amountUSD),
        }
      })

    if (!latestData) {
      return undefined
    }

    const totalValue = latestData.reduce((sum, { amountUSD }) => {
      return sum + amountUSD
    }, 0)

    return {
      totalValue,
      breakdowns: latestData.map(tokenData => ({
        title: tokenData.amount.currency.name || '',
        value: String(tokenData.amountUSD),
        percent: (tokenData.amountUSD / totalValue) * 100,
      })),
    }
  }, [allTokens, positionEarningsState.data?.data?.groupByAccount])

  console.log({ earningBreakdown })

  return (
    <Flex
      sx={{
        gap: '24px',
      }}
    >
      <EarningsBreakdownPanel isLoading={earningsBreakdownState.isValidating} data={earningBreakdown} />
      <MyEarningsOverTimePanel isLoading={earningsOverTimeState.isValidating} data={earningsOverTimeState.data} />
    </Flex>
  )
}

export default MyEarningsSection
