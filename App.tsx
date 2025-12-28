/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { fetchScooters, type Scooter } from './src/features/scooters/api';
import { runtimeConfig } from './src/config';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: safeAreaInsets.bottom }]}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
      <ScooterPreview safeAreaInsets={safeAreaInsets} />
    </View>
  );
}

const ScooterPreview = ({
  safeAreaInsets,
}: {
  safeAreaInsets: ReturnType<typeof useSafeAreaInsets>;
}) => {
  const [state, setState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setState('loading');
      try {
        const data = await fetchScooters();
        setScooters(data);
        setState('success');
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : '无法获取踏板车数据',
        );
        setState('error');
      }
    };

    load();
  }, []);

  return (
    <View style={[styles.previewSection, { paddingBottom: safeAreaInsets.bottom }] }>
      <Text style={styles.previewTitle}>踏板车 Mock API 连接状态</Text>
      <Text style={styles.previewLabel}>
        当前环境：{runtimeConfig.env} · API：
        {runtimeConfig.services.scooterApi.baseUrl || '未配置'}
      </Text>
      {state === 'loading' && <Text style={styles.previewInfo}>正在加载...</Text>}
      {state === 'success' && (
        <Text style={styles.previewInfo}>
          已获取 {scooters.length} 条车辆记录（示例 ID：
          {scooters[0]?.id ?? '暂无'}）
        </Text>
      )}
      {state === 'error' && (
        <Text style={styles.previewError}>{errorMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewLabel: {
    fontSize: 14,
    color: '#555',
  },
  previewInfo: {
    fontSize: 14,
    color: '#0a7cff',
  },
  previewError: {
    fontSize: 14,
    color: '#d64545',
  },
});

export default App;
