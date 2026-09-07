/**
 * SIREN UA KYC Verification Service
 */

import { DataEnvelope } from '../types/dataEnvelope';
import { getJsonFromPaths, isJsonObject } from './apiClient';

export interface KycVerificationData {
  status: 'VERIFIED' | 'PENDING' | 'DOCUMENTS_REQUIRED' | 'UNVERIFIED';
  method: 'DIIA_SIGN' | 'PASSPORT_SCAN' | 'BANK_ID';
  verifiedAt: string;
  documentType: 'ID_CARD' | 'PASSPORT' | 'TAX_NUMBER';
  documentNumberMasked: string;
  taxIdMasked: string;
  limits: {
    maxSingleWithdrawalUah: number;
    monthlyLimitUah: number;
    unlimitedPayouts: boolean;
  };
}

const DEFAULT_KYC: KycVerificationData = {
  status: 'UNVERIFIED',
  method: 'DIIA_SIGN',
  verifiedAt: '',
  documentType: 'ID_CARD',
  documentNumberMasked: '',
  taxIdMasked: '',
  limits: {
    maxSingleWithdrawalUah: 0,
    monthlyLimitUah: 0,
    unlimitedPayouts: false,
  },
};

class KycService {
  private kyc: KycVerificationData = DEFAULT_KYC;

  public async getKycStatus(): Promise<DataEnvelope<KycVerificationData>> {
    const updatedAt = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

    try {
      const remote = await getJsonFromPaths<unknown>([
        '/api/kyc/status',
        '/api/v1/kyc/status',
      ], 2500);
      if (!isJsonObject(remote) || typeof remote.status !== 'string' || !isJsonObject(remote.limits)) {
        throw new Error('KYC payload has invalid shape');
      }

      return {
        data: remote as unknown as KycVerificationData,
        state: 'LIVE',
        source: 'SIREN_UA_KYC_PROVIDER',
        updatedAt,
        isRealData: true,
      };
    } catch {
      // Never claim verified KYC without a provider response.
    }

    return {
      data: this.kyc,
      state: 'NOT_CONNECTED',
      source: 'KYC_PROVIDER_UNAVAILABLE',
      updatedAt,
      isRealData: false,
      error: 'KYC не підтверджено підключеним провайдером',
    };
  }
}

export const kycService = new KycService();
