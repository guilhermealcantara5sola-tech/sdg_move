# Três Letras Move - Engine Pro (React Native + EAS Build Online)

Aplicativo Android desenvolvido em **React Native (Expo)** projetado para testar e treinar a aceitação automática de corridas com filtro de valor e overlay flutuante suspenso sobre a tela.

> ☁️ **Geração de APK 100% Online**: Não é necessário ter Android Studio, Java ou Gradle instalados no computador. Toda a compilação do APK é feita na nuvem pelo **Expo EAS**.

---

## 🚀 Como Gerar o APK Online (Passo a Passo)

### 1. Fazer login na sua conta Expo
No terminal do seu computador (dentro da pasta do projeto):
```bash
npx eas login
```
*(Se ainda não tiver conta, crie gratuitamente em [expo.dev](https://expo.dev))*.

### 2. Disparar a geração do APK na nuvem
Execute o comando:
```bash
npm run build:apk
# ou: npx eas build -p android --profile preview
```

1. O EAS vai perguntar se você deseja criar um projeto na nuvem: responda **Yes (Y)**.
2. O EAS vai perguntar se deseja gerar uma chave de assinatura de Android (Keystore): escolha **Generate a new Android Keystore**.
3. A compilação iniciará nos servidores da Expo.
4. Ao finalizar, o terminal exibirá um **link direto para download do `.apk`** e um **QR Code** para você apontar a câmera do celular e instalar o APK imediatamente!

---

## ⚡ O que o App Faz

1. **Janela Suspensa (Overlay Flutuante)**:
   - Um botão flutuante suspenso na tela que pode ser arrastado para qualquer posição.
   - Funciona por cima do seu aplicativo de Uber ou de qualquer outro app de corrida.
   - Mostra status (Ativo/Pausado), valor mínimo e o resultado da última corrida analisada.

2. **Detecção e Leitura Instantânea (Acessibilidade)**:
   - Lê a tela do Android em milissegundos através do `AccessibilityService`.
   - Identifica valores (`R$ 35,00`), distâncias (`5,0 km`) e botões com palavras-chave (`Aceitar`, `ACEITAR`, `Confirmar`, `PEGAR`).

3. **Filtro de Preço Inteligente**:
   - Se o valor for **igual ou superior ao mínimo** definido: o robô clica no botão imediatamente (em menos de 20ms).
   - Se a corrida for barata: o robô **ignora** e não clica.

4. **Simulador de Teste Embutido**:
   - Dentro do próprio app, toque em **"Abrir Simulador de Corridas"** para testar a velocidade de reação e o clique automático antes de ir para o app real.

5. **Modo Superusuário / Root (Opcional)**:
   - Se o dispositivo possuir Root (`su`), você pode habilitar a opção de injeção física de toque via shell para máxima discrição.

---

## 📂 Estrutura do Projeto

- `App.tsx`: Ponto de entrada do React Native.
- `src/screens/HomeScreen.tsx`: Interface completa de configurações, regras de preço, atalhos rápidos e status de permissões.
- `src/screens/SimulatorModal.tsx`: Tela de treinamento para testar popups de corrida boa vs corrida barata.
- `src/services/AutoAcceptBridge.ts`: Ponte de comunicação entre React Native e o motor nativo.
- `native_src/`: Código nativo (Kotlin) que gerencia o `AccessibilityService`, o Overlay flutuante e a injeção de toques.
- `plugins/withAutoAccept.js`: Plugin do Expo que empacota os serviços nativos automaticamente durante o build online do EAS.
- `eas.json`: Configuração do build online para gerar o arquivo `.apk` diretamente.
