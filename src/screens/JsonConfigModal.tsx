import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { AutoAcceptConfig } from '../services/AutoAcceptBridge';

interface Props {
  visible: boolean;
  currentConfig: AutoAcceptConfig;
  onApplyConfig: (config: AutoAcceptConfig) => void;
  onClose: () => void;
}

export const JsonConfigModal: React.FC<Props> = ({
  visible,
  currentConfig,
  onApplyConfig,
  onClose,
}) => {
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(currentConfig, null, 2)
  );

  const applyPreset = (presetName: string) => {
    let preset: AutoAcceptConfig;

    switch (presetName) {
      case 'uber_carro':
        preset = {
          isEnabled: true,
          minPrice: 22.0,
          minKmRate: 2.0,
          targetPackage: '',
          keywords: 'Aceitar, ACEITAR, Confirmar, PEGAR, Toque para aceitar',
          useRootClick: false,
          forceSwipe: false,
          playCallSound: true,
          viewId: '',
          priceRegex: '',
        };
        break;

      case 'uber_swipe':
        preset = {
          isEnabled: true,
          minPrice: 20.0,
          minKmRate: 1.8,
          targetPackage: '',
          keywords: 'Deslize, Arraste, Slide, Aceitar',
          useRootClick: false,
          forceSwipe: true,
          viewId: '',
          priceRegex: '',
        };
        break;

      case 'moto_delivery':
        preset = {
          isEnabled: true,
          minPrice: 12.0,
          minKmRate: 2.2,
          targetPackage: '',
          keywords: 'Aceitar, Confirmar, Coletar, Entregar, Pegar pedido',
          useRootClick: false,
          forceSwipe: false,
          viewId: '',
          priceRegex: '',
        };
        break;

      case 'root_hardcore':
        preset = {
          isEnabled: true,
          minPrice: 25.0,
          minKmRate: 2.5,
          targetPackage: '',
          keywords: 'Aceitar, ACEITAR, Confirmar',
          useRootClick: true,
          forceSwipe: false,
          viewId: '',
          priceRegex: '',
        };
        break;

      default:
        return;
    }

    setJsonText(JSON.stringify(preset, null, 2));
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed.minPrice !== 'number') {
        Alert.alert('Erro', 'O campo "minPrice" precisa ser um número.');
        return;
      }
      onApplyConfig(parsed);
      Alert.alert('Sucesso!', 'Configuração JSON aplicada instantaneamente no Robô!');
      onClose();
    } catch (e: any) {
      Alert.alert('Erro de JSON', 'Sintaxe inválida: ' + e.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Injeção de Configuração JSON</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Cole abaixo qualquer JSON gerado por IA ou pelo seu programador para reconfigurar o robô em tempo real.
          </Text>

          {/* Atalhos de Presets */}
          <Text style={styles.presetLabel}>Presets Rápidos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('uber_carro')}>
              <Text style={styles.presetChipText}>🚗 Uber / Carro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('uber_swipe')}>
              <Text style={styles.presetChipText}>📲 Deslize (Swipe)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('moto_delivery')}>
              <Text style={styles.presetChipText}>🏍️ Moto / Entrega</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('root_hardcore')}>
              <Text style={styles.presetChipText}>⚡ Superusuário (Root)</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Campo de Edição do JSON */}
          <TextInput
            style={styles.jsonInput}
            multiline
            value={jsonText}
            onChangeText={setJsonText}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setJsonText(JSON.stringify(currentConfig, null, 2))}
            >
              <Text style={styles.exportBtnText}>↺ Restaurar Atual</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>⚡ Injetar JSON Agora</Text>
            </TouchableOpacity>
          </View>
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
    height: '85%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  closeBtn: {
    padding: 6,
  },
  closeTxt: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  presetLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  presetScroll: {
    maxHeight: 36,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  jsonInput: {
    flex: 1,
    backgroundColor: '#070C18',
    color: '#34D399',
    fontFamily: 'monospace',
    fontSize: 13,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
