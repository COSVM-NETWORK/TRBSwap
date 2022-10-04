import { RouteComponentProps } from 'react-router-dom'

import { Container, PageWrapper } from 'components/swapv2/styleds'

import BridgeTransfers from './BridgeTransfers'
import SwapForm from './SwapForm'

export default function Bridge({ history }: RouteComponentProps) {
  return (
    <PageWrapper>
      <Container>
        <SwapForm />
        <BridgeTransfers />
      </Container>
    </PageWrapper>
  )
}
