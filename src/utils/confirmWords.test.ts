import { describe, it, expect } from 'vitest';
import { isConfirmation, isDenial } from './confirmWords';

describe('isConfirmation', () => {
  it.each(['是', '好', '好的', '确认', 'yes', 'ok', 'OK', '行'])('确认词：%s', (w) => {
    expect(isConfirmation(w)).toBe(true);
  });

  it('长句不算确认（startsWith 但超 5 字）', () => {
    expect(isConfirmation('是不是应该再想想这个安排')).toBe(false);
  });

  it('无关短语不算确认', () => {
    expect(isConfirmation('明天')).toBe(false);
    expect(isConfirmation('嗯？')).toBe(false);
  });
});

describe('isDenial', () => {
  it.each(['不', '不用', '不要', '算了', '取消', 'no', 'cancel'])('否认词：%s', (w) => {
    expect(isDenial(w)).toBe(true);
  });

  it('否认按前缀匹配（现行为，长句也命中）', () => {
    expect(isDenial('不用了，改天再说')).toBe(true);
  });

  it('无关短语不算否认', () => {
    expect(isDenial('好的')).toBe(false);
  });
});
