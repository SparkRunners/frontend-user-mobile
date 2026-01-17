import { scooterApiClient } from '../../api/httpClient';

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  balance?: number;
  role?: string;
}

export interface UserBalance {
  balance: number;
  currency?: string;
}

export interface FillupRequest {
  amount: number;
}

export interface FillupResponse {
  balance: number;
  message?: string;
}

const extractProfile = (data: unknown): UserProfile | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;
  const user = obj.user ?? obj;
  
  if (typeof user !== 'object' || !user) {
    return null;
  }

  const userObj = user as Record<string, unknown>;
  const id = typeof userObj.id === 'string' ? userObj.id : 
            typeof userObj._id === 'string' ? userObj._id : null;

  if (!id) {
    return null;
  }

  return {
    id,
    username: typeof userObj.username === 'string' ? userObj.username : undefined,
    email: typeof userObj.email === 'string' ? userObj.email : undefined,
    balance: typeof userObj.balance === 'number' ? userObj.balance : undefined,
    role: typeof userObj.role === 'string' ? userObj.role : undefined,
  };
};

const extractBalance = (data: unknown): number => {
  if (typeof data === 'number') {
    return data;
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    
    // Check top-level balance or newBalance
    if (typeof obj.balance === 'number') {
      return obj.balance;
    }
    if (typeof obj.newBalance === 'number') {
      return obj.newBalance;
    }
    
    // Check nested in user object
    if (obj.user && typeof obj.user === 'object') {
      const user = obj.user as Record<string, unknown>;
      if (typeof user.balance === 'number') {
        return user.balance;
      }
      if (typeof user.newBalance === 'number') {
        return user.newBalance;
      }
    }
    
    // Check nested in data object
    if (obj.data && typeof obj.data === 'object') {
      const nestedData = obj.data as Record<string, unknown>;
      if (typeof nestedData.balance === 'number') {
        return nestedData.balance;
      }
      if (typeof nestedData.newBalance === 'number') {
        return nestedData.newBalance;
      }
    }
  }

  console.warn('[userApi] Could not extract balance from response:', data);
  return 0;
};

export const userApi = {
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await scooterApiClient.get(`/users/${userId}`);
      const profile = extractProfile(response.data);
      
      if (!profile) {
        throw new Error('Invalid user profile response');
      }

      return profile;
    } catch (error) {
      console.error('[userApi] Failed to get profile:', error);
      throw new Error('Kunde inte hämta användarprofil');
    }
  },

  async getBalance(userId: string): Promise<number> {
    try {
      const response = await scooterApiClient.get(`/users/${userId}/balance`);
      return extractBalance(response.data);
    } catch (error) {
      console.error('[userApi] Failed to get balance:', error);
      throw new Error('Kunde inte hämta saldo');
    }
  },

  async fillup(userId: string, amount: number): Promise<FillupResponse> {
    try {
      const response = await scooterApiClient.post(`/users/${userId}/fillup`, { amount });
      console.log('[userApi] Fillup response:', response.data);
      const data = response.data as Record<string, unknown>;
      
      const balance = extractBalance(data);
      console.log('[userApi] Extracted balance:', balance);
      
      return {
        balance,
        message: typeof data.message === 'string' ? data.message : undefined,
      };
    } catch (error) {
      console.error('[userApi] Failed to fillup:', error);
      throw new Error('Kunde inte fylla på saldo');
    }
  },
};
