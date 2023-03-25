import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { useIsConnectedWallet } from 'hooks/useSyncNetworkParamWithStore'

const SignIn = () => {
  const { account } = useActiveWeb3React()
  const [session, setSession] = useState<any>()
  const [sessionAnonymous, setSessionAnonymous] = useState<any>()

  // prevent spam flag
  const requestingAnonymous = useRef(false)
  const requestingSession = useRef<string>()

  const signIn = useCallback(async function signIn(walletAddress: string | undefined) {
    const signInAnonymous = async () => {
      setSession(undefined)
      if (!requestingAnonymous.current) {
        requestingAnonymous.current = true
        const data = await KyberOauth2.loginAnonymous()
        setSessionAnonymous(data)
      }
    }
    try {
      const ClientAppConfig = {
        clientId: 'a2f76ad4-895f-401a-ba75-952a929d782c',
        redirectUri: `${window.location.protocol}//${window.location.host}`,
        mode: 'development',
      }
      KyberOauth2.initialize(ClientAppConfig)
      if (requestingSession.current !== walletAddress) {
        requestingSession.current = walletAddress
        const data = await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
        setSession(data)
      } else if (!walletAddress) {
        signInAnonymous()
      }
    } catch (error) {
      console.log('get session err', error)
      signInAnonymous()
    }
  }, [])

  const isConnectedWallet = useIsConnectedWallet()

  useEffect(() => {
    isConnectedWallet().then(wallet => {
      signIn(typeof wallet === 'string' ? wallet : undefined)
    })
  }, [account, signIn, isConnectedWallet])

  const loginAccount = session?.userInfo?.wallet_address
  const isLogin = loginAccount && account
  return (
    <Flex
      justifyContent={'center'}
      style={{ gap: '10px' }}
      alignItems="center"
      flexDirection="column"
      width="100%"
      margin={'20px'}
    >
      {isLogin ? (
        <Text>Sign in user: {loginAccount}</Text>
      ) : (
        <Text>Anonymous user: {sessionAnonymous?.userInfo?.username}</Text>
      )}
      {isLogin ? (
        <ButtonPrimary width="100px" height="30px" onClick={() => KyberOauth2.logout()}>
          Sign out
        </ButtonPrimary>
      ) : (
        account && (
          <ButtonPrimary width="100px" height="30px" onClick={() => KyberOauth2.authenticate()}>
            Sign in
          </ButtonPrimary>
        )
      )}
    </Flex>
  )
}
export default SignIn
