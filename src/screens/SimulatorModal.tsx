import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const SimulatorModal: React.FC<Props> = ({ visible, onClose }) => {
  const [currentOffer, setCurrentOffer] = useState<{ price: number; km: number } | null>(null);
  const [log, setLog] = useState<string>('Selecione uma simulação abaixo:');
  const [offerTime, setOfferTime] = useState<number>(0);

  const simulateRide = (price: number, km: number) => {
    setOfferTime(Date.now());
    setCurrentOffer({ price, km });
    setLog(`Corrida de R$ ${price.toFixed(2)} emitida na tela...`);
  };

  const handleAcceptPress = () => {
    const elapsed = Date.now() - offerTime;
    setLog(`⚡ CORRIDA ACEITA!\nTempo de Reação: ${elapsed}ms`);
    setCurrentOffer(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Simulador de Corridas Uber</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Treine e valide o robô sem precisar do app do motorista real conectado.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.simButton, { backgroundColor: '#10B981' }]}
              onPress={() => simulateRide(36.8, 5.2)}
            >
              <Text style={styles.simBtnText}>Gerar Boa (R$ 36,80)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.simButton, { backgroundColor: '#EF4444' }]}
              onPress={() => simulateRide(8.5, 4.0)}
            >
              <Text style={styles.simBtnText}>Gerar Baixa (R$ 8,50)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logCard}>
            <Text style={styles.logText}>{log}</Text>
          </View>

          {currentOffer && (
            <View style={styles.rideCard}>
              <Text style={styles.rideBadge}>NOVA SOLICITAÇÃO</Text>
              <Text style={styles.ridePrice}>R$ {currentOffer.price.toFixed(2)}</Text>
              <Text style={styles.rideDist}>Distância: {currentOffer.km} km</Text>

              {/* Este botão contém a palavra-chave "ACEITAR" monitorada pelo Accessibility Engine */}
              <TouchableOpacity
                style={styles.acceptButton}
                activeOpacity={0.8}
                onPress={handleAcceptPress}
              >
                <Text style={styles.acceptText}>ACEITAR CORRIDA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '65%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  closeBtn: {
    padding: 8,
  },
  closeTxt: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  simButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  simBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logCard: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  logText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  rideCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rideBadge: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ridePrice: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  rideDist: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
