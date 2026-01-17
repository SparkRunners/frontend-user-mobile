import { io, Socket } from 'socket.io-client';
import { runtimeConfig } from '../config';
import type { Scooter } from '../features/scooters/api';

type ScootersUpdateCallback = (scooters: Scooter[]) => void;

class SimulationSocketClient {
  private socket: Socket | null = null;
  private listeners: Set<ScootersUpdateCallback> = new Set();
  private isConnecting = false;

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    if (!runtimeConfig.simulation.enabled) {
      console.warn('[SimulationSocket] Simulation mode not enabled');
      return;
    }

    this.isConnecting = true;
    const socketUrl = runtimeConfig.simulation.socketUrl;

    console.log(`[SimulationSocket] Connecting to simulation server: ${socketUrl}`);

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[SimulationSocket] Connected to simulation system');
      this.isConnecting = false;
    });

    this.socket.on('disconnect', reason => {
      console.log(`[SimulationSocket] Disconnected: ${reason}`);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', error => {
      console.error('[SimulationSocket] Connection error:', error.message);
      this.isConnecting = false;
    });

    // Listen for initial data push
    this.socket.on('scooters:init', (scooters: Scooter[]) => {
      console.log(`[SimulationSocket] Received initial data: ${scooters.length} scooters`);
      this.notifyListeners(scooters);
    });

    // Listen for incremental updates (every 3 seconds)
    this.socket.on('scooters:update', (scooters: Scooter[]) => {
      this.notifyListeners(scooters);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[SimulationSocket] Disconnecting from simulation');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  subscribe(callback: ScootersUpdateCallback) {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(scooters: Scooter[]) {
    this.listeners.forEach(callback => callback(scooters));
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const simulationSocket = new SimulationSocketClient();
