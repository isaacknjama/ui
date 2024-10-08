import React, { useCallback, useState } from 'react';
import { Flex, useClipboard, Text } from '@chakra-ui/react';
import { useTranslation } from '@fedimint/utils';
import { Bip21Uri, FederationInfo, Sats } from '@fedimint/types';
import { WalletModalState } from '../WalletModal';
import FederationSelector from '../FederationSelector';
import { AmountInput, CreateButton, QRCodeTabs } from '..';
import { useGatewayApi } from '../../../../context/hooks';

interface ReceiveOnchainProps {
  federations: FederationInfo[];
  walletModalState: WalletModalState;
  setWalletModalState: (state: WalletModalState) => void;
  setShowSelector: (show: boolean) => void;
}

const ReceiveOnchain: React.FC<ReceiveOnchainProps> = ({
  federations,
  walletModalState,
  setWalletModalState,
  setShowSelector,
}) => {
  const { t } = useTranslation();
  const api = useGatewayApi();
  const [amount, setAmount] = useState<Sats>(0 as Sats);
  const [bip21Uri, setBip21Uri] = useState<Bip21Uri>();
  const [showAddressInfo, setShowAddressInfo] = useState(false);
  const { onCopy: onCopyUri } = useClipboard(bip21Uri?.toString() ?? '');
  const { onCopy: onCopyAddress } = useClipboard(bip21Uri?.address ?? '');

  const handleCreateDepositAddress = useCallback(() => {
    if (!walletModalState.selectedFederation) return;
    api
      .fetchPegInAddress(walletModalState.selectedFederation.federation_id)
      .then((newAddress: string) => {
        const bip21Uri = new Bip21Uri(newAddress, amount);
        setBip21Uri(bip21Uri);
        setShowSelector(false);
        setShowAddressInfo(true);
      })
      .catch(({ message, error }) => {
        console.error(error, message);
        alert(t('wallet-modal.receive.address-error', { error: message }));
      });
  }, [api, walletModalState.selectedFederation, amount, setShowSelector, t]);

  if (showAddressInfo) {
    return (
      <Flex direction='column' gap={2} align='center'>
        <Text>
          {t('wallet-modal.receive.peg-in-instructions', {
            federationName:
              walletModalState.selectedFederation?.config.global.meta
                .federation_name,
          })}
        </Text>
        <QRCodeTabs
          uriValue={bip21Uri?.toString() ?? ''}
          addressValue={bip21Uri?.address ?? ''}
          onCopyUri={onCopyUri}
          onCopyAddress={onCopyAddress}
          uriLabel={t('common.uri')}
          addressLabel={t('common.address')}
        />
      </Flex>
    );
  }

  return (
    <Flex direction='column' gap={4}>
      <FederationSelector
        federations={federations}
        walletModalState={walletModalState}
        setWalletModalState={setWalletModalState}
      />
      <AmountInput amount={amount} setAmount={setAmount} unit='sats' />
      <CreateButton
        onClick={handleCreateDepositAddress}
        label={t('wallet-modal.receive.create-peg-in-address')}
      />
    </Flex>
  );
};

export default ReceiveOnchain;
