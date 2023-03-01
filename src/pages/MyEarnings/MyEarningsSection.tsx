import { Flex } from 'rebass'

import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useGetEarningsBreakdown from 'hooks/myEarnings/useGetEarningsBreakdown'
import useGetEarningsOverTime from 'hooks/myEarnings/useGetEarningsOverTime'
import useGetPositionEarnings from 'hooks/myEarnings/useGetPositionEarnings'

import EarningsBreakdownPanel from './EarningsBreakdownPanel'
import MyEarningsOverTimePanel from './MyEarningsOverTimePanel'

const MyEarningsSection = () => {
  const { chainId } = useActiveWeb3React()
  const earningsBreakdownState = useGetEarningsBreakdown()
  const earningsOverTimeState = useGetEarningsOverTime()

  // TODO: chainId is missing in response
  const positionEarningsState = useGetPositionEarnings()
  const allTokens = useAllTokens()

  return (
    <Flex
      sx={{
        gap: '24px',
      }}
    >
      <EarningsBreakdownPanel isLoading={earningsBreakdownState.isValidating} data={earningsBreakdownState.data} />
      <MyEarningsOverTimePanel isLoading={earningsOverTimeState.isValidating} data={earningsOverTimeState.data} />
    </Flex>
  )
}

export default MyEarningsSection
