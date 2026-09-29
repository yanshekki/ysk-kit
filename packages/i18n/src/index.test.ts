import { describe, expect, it } from 'vitest';
import { t } from './index';

describe('i18n', () => {
  it('picks locale from a bilingual dictionary', () => {
    const dict = { hello: { 'zh-HK': '你好', en: 'Hello' } };
    expect(t(dict, 'hello', 'en')).toBe('Hello');
    expect(t(dict, 'hello')).toBe('你好');
  });
});
