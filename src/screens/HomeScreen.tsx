import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BridgeService, SystemStatus, RideEvent, AutoAcceptConfig } from '../services/AutoAcceptBridge';
import { SimulatorModal } from './SimulatorModal';
import { JsonConfigModal } from './JsonConfigModal';

export const HomeScreen: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    hasOverlay: false,
    isAccessibilityActive: false,
    isRootAvailable: false,
    isOverlayRunning: false,
  });

  const [minPrice, setMinPrice] = useState<string>('20.00');
  const [minKmRate, setMinKmRate] = useState<string>('0.0');
  const [keywords, setKeywords] = useState<string>('Aceitar, ACEITAR, Confirmar, PEGAR, Pegar pedido, Coletar, Entregar, Toque para aceitar');
  const [targetPackage, setTargetPackage] = useState<string>('');
  const [useRootClick, setUseRootClick] = useState<boolean>(false);
  const [forceSwipe, setForceSwipe] = useState<boolean>(false);
  const [playCallSound, setPlayCallSound] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  const [viewId, setViewId] = useState<string>('');
  const [priceRegex, setPriceRegex] = useState<string>('');

  const [history, setHistory] = useState<RideEvent[]>([]);
  const [simulatorVisible, setSimulatorVisible] = useState<boolean>(false);
  const [jsonModalVisible, setJsonModalVisible] = useState<boolean>(false);

  useEffect(() => {
    loadSavedSettings();
    refreshPermissions();

    const sub = BridgeService.subscribeRideEvents((event) => {
      setHistory((prev) => [event, ...prev.slice(0, 9)]);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const loadSavedSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@tl_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMinPrice(parsed.minPrice?.toString() || '20.00');
        setMinKmRate(parsed.minKmRate?.toString() || '0.0');
        setKeywords(parsed.keywords || 'Aceitar, ACEITAR, Confirmar, PEGAR');
        setTargetPackage(parsed.targetPackage || '');
        setUseRootClick(parsed.useRootClick || false);
        setForceSwipe(parsed.forceSwipe || false);
        setPlayCallSound(parsed.playCallSound ?? true);
        setIsEnabled(parsed.isEnabled ?? true);
      }
    } catch (e) {
      console.log('Erro ao carregar settings', e);
    }
  };

  const refreshPermissions = async () => {
    const s = await BridgeService.checkPermissions();
    setStatus(s);
  };

  const saveSettings = async () => {
    const config = {
      isEnabled,
      minPrice: parseFloat(minPrice) || 20.0,
      minKmRate: parseFloat(minKmRate) || 0.0,
      keywords,
      targetPackage,
      useRootClick,
      forceSwipe,
      playCallSound,
    };

    await AsyncStorage.setItem('@tl_config', JSON.stringify(config));
    BridgeService.updateConfig(config);
    Alert.alert('Sucesso', 'Regras do robô salvas no motor nativo!');
  };

  const currentConfig: AutoAcceptConfig = {
    isEnabled,
    minPrice: parseFloat(minPrice) || 20.0,
    minKmRate: parseFloat(minKmRate) || 0.0,
    keywords,
    targetPackage,
    useRootClick,
    forceSwipe,
    playCallSound,
    viewId,
    priceRegex,
  };

  const handleApplyJsonConfig = async (newConfig: AutoAcceptConfig) => {
    setIsEnabled(newConfig.isEnabled);
    setMinPrice(newConfig.minPrice.toString());
    setMinKmRate((newConfig.minKmRate || 0).toString());
    setKeywords(newConfig.keywords);
    setTargetPackage(newConfig.targetPackage || '');
    setUseRootClick(newConfig.useRootClick || false);
    setForceSwipe(newConfig.forceSwipe || false);
    setPlayCallSound(newConfig.playCallSound ?? true);
    setViewId(newConfig.viewId || '');
    setPriceRegex(newConfig.priceRegex || '');

    await AsyncStorage.setItem('@tl_config', JSON.stringify(newConfig));
    BridgeService.updateConfig(newConfig);
  };

  const toggleOverlay = () => {
    if (!status.hasOverlay) {
      Alert.alert(
        'Permissão Necessária',
        'Autorize a sobreposição de tela para que o botão flutuante possa ficar sobre o seu aplicativo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Conceder', onPress: () => BridgeService.openOverlaySettings() },
        ]
      );
      return;
    }

    if (status.isOverlayRunning) {
      BridgeService.stopFloatingHUD();
      setStatus((prev) => ({ ...prev, isOverlayRunning: false }));
    } else {
      saveSettings();
      BridgeService.startFloatingHUD();
      setStatus((prev) => ({ ...prev, isOverlayRunning: true }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TRÊS LETRAS MOVE</Text>
          <Text style={styles.badge}>ENGINE PRO</Text>
        </View>
        <Text style={styles.subtitle}>
          Automação de Aceite Instantâneo & Filtro de Preço
        </Text>

        {/* Card de Permissões */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Diagnóstico de Permissões</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Janela Suspensa (Overlay):{' '}
              <Text style={status.hasOverlay ? styles.green : styles.red}>
                {status.hasOverlay ? 'Ativo ✅' : 'Pendente ❌'}
              </Text>
            </Text>
            {!status.hasOverlay && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => BridgeService.openOverlaySettings()}
              >
                <Text style={styles.actionBtnText}>Conceder</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Acessibilidade Ultrarrápida:{' '}
              <Text style={status.isAccessibilityActive ? styles.green : styles.red}>
                {status.isAccessibilityActive ? 'Conectado ✅' : 'Desativado ❌'}
              </Text>
            </Text>
            {!status.isAccessibilityActive && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => BridgeService.openAccessibilitySettings()}
              >
                <Text style={styles.actionBtnText}>Ativar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Superusuário (Root):{' '}
              <Text style={status.isRootAvailable ? styles.green : styles.gray}>
                {status.isRootAvailable ? 'Disponível ✅' : 'Modo Nativo (Sem Root)'}
              </Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={refreshPermissions}>
            <Text style={styles.refreshBtnText}>🔄 Atualizar Status</Text>
          </TouchableOpacity>
        </View>

        {/* Card de Filtros */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Filtros e Inteligência de Aceite</Text>

          <Text style={styles.label}>Valor Mínimo da Corrida (R$)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="Ex: 22.50"
            placeholderTextColor="#64748B"
          />

          {/* Atalhos Rápidos de Preço */}
          <View style={styles.quickPrices}>
            {['15', '20', '25', '30', '35'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.quickPriceBtn,
                  minPrice === `${p}.00` && styles.quickPriceSelected,
                ]}
                onPress={() => setMinPrice(`${p}.00`)}
              >
                <Text style={styles.quickPriceText}>R${p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Valor Mínimo por KM (0 = desativado)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={minKmRate}
            onChangeText={setMinKmRate}
            placeholder="Ex: 2.20"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>Palavras-chave do Botão de Aceite</Text>
          <TextInput
            style={styles.input}
            value={keywords}
            onChangeText={setKeywords}
            placeholder="Aceitar, Confirmar, PEGAR"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>Pacote do App Alvo (em branco = monitora tudo)</Text>
          <TextInput
            style={styles.input}
            value={targetPackage}
            onChangeText={setTargetPackage}
            placeholder="Ex: com.uber.motorista (opcional)"
            placeholderTextColor="#64748B"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Modo Deslizar (Swipe): arrasta o botão em vez de clicar
            </Text>
            <Switch
              value={forceSwipe}
              onValueChange={setForceSwipe}
              trackColor={{ false: '#334155', true: '#06B6D4' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Tocar Chamada Telefônica ao Aceitar ({playCallSound ? 'Ativo 🔔' : 'Silencioso / Furtivo 🔕'})
            </Text>
            <Switch
              value={playCallSound}
              onValueChange={setPlayCallSound}
              trackColor={{ false: '#334155', true: '#10B981' }}
            />
          </View>

          {status.isRootAvailable && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Disparar toque físico via Shell Root (su)
              </Text>
              <Switch
                value={useRootClick}
                onValueChange={setUseRootClick}
                trackColor={{ false: '#334155', true: '#06B6D4' }}
              />
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
            <Text style={styles.saveBtnText}>💾 Salvar Parâmetros</Text>
          </TouchableOpacity>
        </View>

        {/* Ações Principais */}
        <TouchableOpacity
          style={[
            styles.mainOverlayBtn,
            status.isOverlayRunning ? styles.bgRed : styles.bgCyan,
          ]}
          onPress={toggleOverlay}
        >
          <Text style={styles.mainOverlayText}>
            {status.isOverlayRunning
              ? '⏹ PARAR HUD FLUTUANTE'
              : '🚀 INICIAR ROBÔ FLUTUANTE NA TELA'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.jsonBtn}
          onPress={() => setJsonModalVisible(true)}
        >
          <Text style={styles.jsonBtnText}>⚡ INJETAR / IMPORTAR CONFIGURAÇÃO JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.simBtn}
          onPress={() => setSimulatorVisible(true)}
        >
          <Text style={styles.simBtnText}>🎯 Abrir Simulador de Corridas</Text>
        </TouchableOpacity>

        {/* Histórico Recente */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Corridas Detectadas em Tempo Real</Text>
            {history.map((item, idx) => (
              <View key={idx} style={styles.historyRow}>
                <Text
                  style={[
                    styles.historyBadge,
                    item.accepted ? styles.badgeGreen : styles.badgeRed,
                  ]}
                >
                  {item.accepted ? 'ACEITA' : 'IGNORADA'}
                </Text>
                <Text style={styles.historyText}>R$ {item.price.toFixed(2)}</Text>
                {item.accepted && (
                  <Text style={styles.historyElapsed}>⏱ {item.elapsedMs}ms</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <SimulatorModal
        visible={simulatorVisible}
        onClose={() => setSimulatorVisible(false)}
      />

      <JsonConfigModal
        visible={jsonModalVisible}
        currentConfig={currentConfig}
        onApplyConfig={handleApplyJsonConfig}
        onClose={() => setJsonModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#06B6D4',
  },
  badge: {
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
  },
  green: { color: '#10B981', fontWeight: 'bold' },
  red: { color: '#EF4444', fontWeight: 'bold' },
  gray: { color: '#94A3B8' },
  actionBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  actionBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  refreshBtnText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1F2937',
    color: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickPrices: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickPriceBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickPriceSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#083344',
  },
  quickPriceText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  saveBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  saveBtnText: {
    color: '#06B6D4',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mainOverlayBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  bgCyan: { backgroundColor: '#06B6D4' },
  bgRed: { backgroundColor: '#EF4444' },
  mainOverlayText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  jsonBtn: {
    backgroundColor: '#0F2942',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  jsonBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  simBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  historyBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGreen: { backgroundColor: '#064E3B', color: '#34D399' },
  badgeRed: { backgroundColor: '#7F1D1D', color: '#F87171' },
  historyText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyElapsed: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
