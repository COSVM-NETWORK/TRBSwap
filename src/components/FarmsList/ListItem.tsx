/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import { useMedia } from 'react-use'

import { ChainId, Fraction, JSBI, Token } from 'libs/sdk/src'
import { DMM_ANALYTICS_URL } from '../../constants'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { Farm } from 'state/farms/types'
import { formattedNum, getTokenSymbol, isAddressString, shortenAddress } from 'utils'
import InputGroup from './InputGroup'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useTokenBalance from 'hooks/useTokenBalance'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { getTradingFeeAPR, useFarmApr, useFarmRewardPerBlocks, useFarmRewards } from 'utils/dmm'
import { ExternalLink } from 'theme'
import { RewardToken } from 'pages/Farms/styleds'
import InfoHelper from 'components/InfoHelper'

const TableRow = styled.div<{ fade?: boolean; isExpanded?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: 2fr 1.5fr 1fr 2fr 1fr 0.25fr;
  grid-template-areas: 'pools liq apy reward staked_balance expand';
  padding: 15px 36px 13px 26px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.bg15};
  border: 1px solid transparent;
  border-bottom: 1px solid ${({ theme, isExpanded }) => (isExpanded ? 'transparent' : theme.advancedBorder)};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};

  &:hover {
    cursor: pointer;
  }
`

const ExpandedSection = styled.div`
  background-color: ${({ theme }) => theme.bg15};
  padding: 0 36px;
`

export const ExpandedContent = styled.div`
  border-radius: 10px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 14px;
  font-weight: 500;
  padding: 16px 24px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    background-color: ${({ theme }) => theme.evenRow};
    margin-bottom: 1rem;
  `};
`

const StakeGroup = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 3fr 3fr 2fr;
  grid-template-areas: 'stake unstake harvest';
  margin-bottom: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
    grid-template-areas: 'stake';
  `};
`

const BalanceInfo = styled.div`
  display: flex;
  justify-content: space-between;
`

const GreyText = styled.div`
  color: ${({ theme }) => theme.primaryText2};
  margin-bottom: 8px;
`

const LPInfoContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const LPInfo = styled.div`
  margin-right: 24px;
  font-size: 14px;
  font-weight: 500;
  color: #08a1e7;
  line-height: 2;
`

const GetLP = styled.span`
  font-size: 14px;
  font-weight: 600;
`

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.bg13};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 20px;
  `}
`

const DataText = styled(Flex)<{ align?: string }>`
  color: ${({ theme }) => theme.text7};
  justify-content: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    font-size: 14px;
  `}
`

const APY = styled(DataText)`
  color: ${({ theme }) => theme.text12};
`

const GridItem = styled.div<{ noBorder?: boolean }>`
  position: relative;
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

const DataTitle = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.text6};
  &:hover {
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-size: 12px;
`

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
}

const ListItem = ({ farm }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const [expand, setExpand] = useState<boolean>(false)
  const xxlBreakpoint = useMedia('(min-width: 1200px)')

  const currency0 = useToken(farm.token0?.id) as Token
  const currency1 = useToken(farm.token1?.id) as Token

  const poolAddressChecksum = isAddressString(farm.id)
  const { value: userTokenBalance, decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  const userStakedBalance = farm.userData?.stakedBalance
    ? BigNumber.from(farm.userData?.stakedBalance)
    : BigNumber.from(0)

  const farmRewards = useFarmRewards([farm])
  const farmRewardPerBlocks = useFarmRewardPerBlocks([farm])

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )

  // Ratio in % of user's LP tokens balance, vs the total number in circulation
  const lpUserLPBalanceRatio = new Fraction(
    userTokenBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )

  // Ratio in % of LP tokens that user staked, vs the total number in circulation
  const lpUserStakedTokenRatio = new Fraction(
    userStakedBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )

  const userLPBalanceUSD = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const userStakedBalanceUSD = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farmRewardPerBlocks, liquidity.toString())

  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)

  const apr = farmAPR + tradingFeeAPR

  const amp = farm.amp / 10000

  return xxlBreakpoint ? (
    <>
      <TableRow isExpanded={expand} onClick={() => setExpand(!expand)}>
        <DataText grid-area="pools">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin={true} />
              <span>
                {farm.token0?.symbol} - {farm.token1?.symbol} (AMP = {amp})
              </span>
            </>
          </div>
        </DataText>
        <DataText grid-area="liq" align="right">
          {formattedNum(liquidity.toString(), true)}
        </DataText>
        <APY grid-area="apy">{apr.toFixed(2)}%</APY>
        <DataText
          grid-area="reward"
          align="right"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
        >
          {farmRewards.map((reward, index) => {
            return (
              <span key={reward.token.address}>
                <span>{`${getFullDisplayBalance(reward?.amount)} ${getTokenSymbol(reward.token, chainId)}`}</span>
                {index + 1 < farmRewards.length ? <span style={{ margin: '0 4px' }}>+</span> : null}
              </span>
            )
          })}
        </DataText>
        <DataText grid-area="staked_balance" align="right">
          {formattedNum(userStakedBalanceUSD.toString(), true)}
        </DataText>
        <ExpandableSectionButton expanded={expand} />
      </TableRow>

      {expand && (
        <ExpandedSection>
          <ExpandedContent>
            <StakeGroup style={{ marginBottom: '14px' }}>
              <BalanceInfo grid-area="stake">
                <GreyText>
                  Balance: {getFullDisplayBalance(userTokenBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                  {farm.token1?.symbol} LP
                </GreyText>
                <GreyText>{formattedNum(userLPBalanceUSD.toString(), true)}</GreyText>
              </BalanceInfo>
              <BalanceInfo grid-area="unstake">
                <GreyText>
                  Deposit: {getFullDisplayBalance(userStakedBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                  {farm.token1?.symbol} LP
                </GreyText>
                <GreyText>{formattedNum(userStakedBalanceUSD.toString(), true)}</GreyText>
              </BalanceInfo>
              <div grid-area="harvest">
                <GreyText>Reward</GreyText>
              </div>
            </StakeGroup>
            <StakeGroup>
              <InputGroup
                fairLaunchAddress={farm.fairLaunchAddress}
                pid={farm.pid}
                pairAddress={farm.id}
                pairSymbol={`${farm.token0.symbol}-${farm.token1.symbol} LP`}
                token0Address={farm.token0.id}
                token1Address={farm.token1.id}
                farmRewards={farmRewards}
              />
            </StakeGroup>
            <LPInfoContainer>
              <ExternalLink href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/pool/${farm.id}`}>
                <LPInfo>{shortenAddress(farm.id)}</LPInfo>
              </ExternalLink>
              <Link to={`/add/${farm.token0?.id}/${farm.token1?.id}/${farm.id}`} style={{ textDecoration: 'none' }}>
                <GetLP>
                  Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                </GetLP>
              </Link>
            </LPInfoContainer>
          </ExpandedContent>
        </ExpandedSection>
      )}
    </>
  ) : (
    <>
      <StyledItemCard onClick={() => setExpand(!expand)}>
        <GridItem style={{ gridColumn: '1 / span 2' }}>
          <DataTitle>
            <span>Pool | AMP</span>
            <InfoHelper
              text={
                'AMP = Amplification factor. Amplified pools have higher capital efficiency. Higher AMP, higher capital efficiency and amplified liquidity within a price range.'
              }
            />
          </DataTitle>
          <DataText grid-area="pools">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin={true} />
                <span>
                  {farm.token0?.symbol} - {farm.token1?.symbol} (AMP = {amp})
                </span>
              </>
            </div>
          </DataText>

          <span style={{ position: 'absolute', top: '0', right: '0' }}>
            <ExpandableSectionButton expanded={expand} />
          </span>
        </GridItem>

        <GridItem>
          <DataTitle>
            <span>Liquidity</span>
          </DataTitle>
          <DataText grid-area="liq">
            <div>{formattedNum(liquidity.toString(), true)}</div>
          </DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <span>APY</span>
            <InfoHelper text={'Estimated total annualized yield from rewards.'} />
          </DataTitle>
          <DataText grid-area="apy">
            <APY grid-area="apy">{apr.toFixed(2)}%</APY>
          </DataText>
        </GridItem>

        <GridItem noBorder>
          <DataTitle>My Rewards</DataTitle>
          <DataText style={{ display: 'flex', flexDirection: 'column' }}>
            {farmRewards.map((reward, index) => {
              return (
                <RewardToken key={reward.token.address}>
                  <span>{`${getFullDisplayBalance(reward?.amount)} ${getTokenSymbol(reward.token, chainId)}`}</span>
                  {index + 1 < farmRewards.length ? <span style={{ margin: '0 4px' }}>+</span> : null}
                </RewardToken>
              )
            })}
          </DataText>
        </GridItem>

        <GridItem noBorder>
          <DataTitle>My Deposit</DataTitle>
          <DataText>{formattedNum(userStakedBalanceUSD.toString(), true)}</DataText>
        </GridItem>
      </StyledItemCard>

      {expand && (
        <ExpandedContent>
          <StakeGroup style={{ marginBottom: '14px' }}>
            <BalanceInfo grid-area="stake">
              <GreyText>
                Balance: {getFullDisplayBalance(userTokenBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                {farm.token1?.symbol} LP
              </GreyText>
              <GreyText>{formattedNum(userLPBalanceUSD.toString(), true)}</GreyText>
            </BalanceInfo>
            <BalanceInfo grid-area="unstake">
              <GreyText>
                Deposit: {getFullDisplayBalance(userStakedBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                {farm.token1?.symbol} LP
              </GreyText>
              <GreyText>{formattedNum(userStakedBalanceUSD.toString(), true)}</GreyText>
            </BalanceInfo>
            <div grid-area="harvest">
              <GreyText>Reward</GreyText>
            </div>

            <InputGroup
              fairLaunchAddress={farm.fairLaunchAddress}
              pid={farm.pid}
              pairAddress={farm.id}
              pairSymbol={`${farm.token0.symbol}-${farm.token1.symbol} LP`}
              token0Address={farm.token0.id}
              token1Address={farm.token1.id}
              farmRewards={farmRewards}
            />

            <LPInfoContainer>
              <ExternalLink href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/pool/${farm.id}`}>
                <LPInfo>{shortenAddress(farm.id)}</LPInfo>
              </ExternalLink>
              <Link to={`/add/${farm.token0?.id}/${farm.token1?.id}/${farm.id}`} style={{ textDecoration: 'none' }}>
                <GetLP>
                  Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                </GetLP>
              </Link>
            </LPInfoContainer>
          </StakeGroup>
        </ExpandedContent>
      )}
    </>
  )
}

export default ListItem
