import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import Loader from 'components/Loader'
import { RowBetween, RowFit } from 'components/Row'
import { useVotingInfo } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import YourTransactionsModal from '../StakeKNC/YourTransactionsModal'
import ProposalItem from './ProposalItem'
import SearchProposal from './SearchProposal'
import SelectProposalStatus from './SelectProposalStatus'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  margin-top: 10px;
`

const TextButton = styled.a`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  ${({ theme }) => css`
    color: ${theme.subText};
    :hover {
      color: ${lighten(0.2, theme.primary)} !important;
    }
  `}
`
const HistoryButton = styled(RowFit)`
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    color: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

export default function ProposalListComponent() {
  const theme = useTheme()
  const { proposals } = useVotingInfo()
  const [status, setStatus] = useState<string | undefined>()
  const [search, setSearch] = useState<string | undefined>()
  const filteredProposals = useMemo(
    () =>
      proposals
        ?.filter(p => {
          if (!!status) {
            return p.status === status
          }
          if (!!search) {
            return p.title.toLowerCase().search(search.toLowerCase()) >= 0
          }
          return true
        })
        .sort((a, b) => b.proposal_id - a.proposal_id),
    [proposals, status, search],
  )
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)

  return (
    <Wrapper>
      <RowBetween marginBottom={'10px'}>
        <Flex>
          <Text color={theme.primary} fontSize={20}>
            <Trans>KIPs</Trans>
          </Text>
        </Flex>
        <Flex style={{ gap: '30px' }}>
          <HistoryButton onClick={toggleYourTransactions}>
            <History />
            <Text fontSize={14} hidden={isMobile}>
              {' '}
              <Trans>History</Trans>
            </Text>
          </HistoryButton>
          <TextButton href="https://gov.kyber.org/" target="_blank" rel="noreferrer">
            <ForumIcon />{' '}
            <Text hidden={isMobile}>
              <Trans>Forum</Trans>
            </Text>
          </TextButton>
        </Flex>
      </RowBetween>
      <RowBetween>
        <SelectProposalStatus status={status} setStatus={setStatus} />
        <SearchProposal search={search} setSearch={setSearch} />
      </RowBetween>
      {filteredProposals ? (
        filteredProposals.map(p => {
          return <ProposalItem key={p.proposal_id.toString()} proposal={p} />
        })
      ) : (
        <Loader />
      )}
      <YourTransactionsModal />
    </Wrapper>
  )
}
