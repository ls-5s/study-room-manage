import type { Transaction } from 'sequelize';
import type { SystemSetting } from '../models/system-setting.model.js';

export interface SettingsModels {
  SystemSetting: typeof SystemSetting;
}

/**
 * Typed access to `system_settings`. Business modules validate their own value ranges; this
 * service only guarantees JSON round-tripping and that writes are attributable.
 */
export class SettingsService {
  constructor(
    private readonly models: SettingsModels,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getJson<T>(key: string, fallback: T): Promise<T> {
    const row = await this.models.SystemSetting.findByPk(key);
    if (!row) return fallback;
    const value = row.value_json as unknown;
    return (value === null || value === undefined ? fallback : value) as T;
  }

  async setJson(
    key: string,
    value: unknown,
    operatorId: string,
    transaction?: Transaction,
  ): Promise<void> {
    const timestamp = this.now();
    const options = transaction ? { transaction } : {};
    const existing = await this.models.SystemSetting.findByPk(key, options);
    if (existing) {
      await existing.update(
        { value_json: value, updated_by: operatorId, updated_at: timestamp },
        options,
      );
      return;
    }
    await this.models.SystemSetting.create(
      {
        key,
        value_json: value,
        description: null,
        updated_by: operatorId,
        updated_at: timestamp,
      },
      options,
    );
  }
}
