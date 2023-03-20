import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { Flex } from 'rebass'
import { useGetEarningDataQuery } from 'services/earning'

import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useGetEarningsBreakdown from 'hooks/myEarnings/useGetEarningsBreakdown'
import useGetEarningsOverTime from 'hooks/myEarnings/useGetEarningsOverTime'
import { EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'

import EarningsBreakdownPanel from './EarningsBreakdownPanel'
import MyEarningsOverTimePanel from './MyEarningsOverTimePanel'

const MyEarningsSection = () => {
  const { chainId, account } = useActiveWeb3React()
  const earningsBreakdownState = useGetEarningsBreakdown()
  const earningsOverTimeState = useGetEarningsOverTime()

  const getEarningData = useGetEarningDataQuery({
    account: account || '',
    chainIds: [ChainId.MAINNET],
  })
  const allTokens = useAllTokens()

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    const data = getEarningData?.data?.['ethereum']?.account
    console.log({ data })
    const latestData = getEarningData?.data?.['ethereum']?.account
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
        return {
          currency,
          amount: Number(tokenData.amountFloat),
          amountUSD: tokenData.amountUSD,
        }
      })

    if (!latestData) {
      return undefined
    }

    const totalValue = latestData.reduce((sum, { amountUSD }) => {
      return sum + Number(amountUSD)
    }, 0)

    return {
      totalValue,
      breakdowns: latestData.map(tokenData => ({
        title: tokenData.currency.symbol || '',
        value: String(tokenData.amountUSD),
        percent: (Number(tokenData.amountUSD) / totalValue) * 100,
      })),
    }
  }, [allTokens, chainId, getEarningData?.data])

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
