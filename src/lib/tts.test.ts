import { describe, it, expect, vi, afterEach } from 'vitest';
import { speakTransferConfirm, speakTransferSuccess, speakReceived, getTtsLang, setTtsLang } from './tts';

function mockSpeech() {
  const spoken: string[] = [];
  class FakeUtterance {
    text: string;
    lang = '';
    rate = 1;
    pitch = 1;
    voice: unknown = null;
    constructor(text: string) {
      this.text = text;
      spoken.push(text);
    }
  }
  const speak = vi.fn();
  const cancel = vi.fn();
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    speak,
    cancel,
    getVoices: () => [
      { lang: 'zh-CN', name: 'Chinese', default: false, localService: true, voiceURI: 'x' },
      { lang: 'en-US', name: 'US English', default: false, localService: true, voiceURI: 'y' },
    ],
  });
  return { spoken, speak, cancel };
}

describe('tts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('is a safe no-op when speechSynthesis is unavailable', () => {
    expect(speakTransferConfirm(5, 'USD', 'zh')).toBe(false);
    expect(speakTransferSuccess('zh', 5, 'USD')).toBe(false);
  });

  it('speaks the confirm amount in Chinese', () => {
    const { spoken, speak, cancel } = mockSpeech();
    const ok = speakTransferConfirm(3, 'USD', 'zh');
    expect(ok).toBe(true);
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledOnce();
    expect(spoken[0]).toBe('你转出 3.00 美元的资金，请你确认');
  });

  it('speaks the confirm amount in English', () => {
    const { spoken } = mockSpeech();
    speakTransferConfirm(3, 'USD', 'en');
    expect(spoken[0]).toBe('You are transferring out $3.00, please confirm.');
  });

  it('speaks the confirm amount in Khmer', () => {
    const { spoken } = mockSpeech();
    speakTransferConfirm(3, 'USD', 'km');
    expect(spoken[0]).toBe('អ្នកកំពុងផ្ទេរចំនួនទឹកប្រាក់ 3.00 ដុល្លារ សូមបញ្ជាក់');
    speakTransferConfirm(5000, 'KHR', 'km');
    expect(spoken[1]).toBe('អ្នកកំពុងផ្ទេរចំនួនទឹកប្រាក់ 5,000 រៀល សូមបញ្ជាក់');
  });

  it('speaks KHR with thousand separators', () => {
    const { spoken } = mockSpeech();
    speakTransferConfirm(5000, 'KHR', 'zh');
    expect(spoken[0]).toBe('你转出 5,000 瑞尔的资金，请你确认');
    speakTransferConfirm(5000, 'KHR', 'en');
    expect(spoken[1]).toBe('You are transferring out 5,000 KHR, please confirm.');
  });

  it('speaks success with outbound amount in all languages (never balance)', () => {
    const { spoken } = mockSpeech();
    speakTransferSuccess('zh', 3, 'USD');
    expect(spoken[0]).toBe('转账成功，你已转出 3.00 美元的资金，请你确认');
    speakTransferSuccess('en', 3, 'USD');
    expect(spoken[1]).toBe('Transfer successful. You have transferred out $3.00, please confirm.');
    speakTransferSuccess('km', 3, 'USD');
    expect(spoken[2]).toBe('ផ្ទេរជោគជ័យ អ្នកបានផ្ទេរចំនួនទឹកប្រាក់ 3.00 ដុល្លារ សូមបញ្ជាក់');
  });

  it('speaks success with KHR outbound amount', () => {
    const { spoken } = mockSpeech();
    speakTransferSuccess('zh', 5000, 'KHR');
    expect(spoken[0]).toBe('转账成功，你已转出 5,000 瑞尔的资金，请你确认');
    speakTransferSuccess('en', 5000, 'KHR');
    expect(spoken[1]).toBe('Transfer successful. You have transferred out 5,000 KHR, please confirm.');
  });

  it('speaks the received transfer amount (PaySound) in all languages', () => {
    const { spoken } = mockSpeech();
    speakReceived(5, 'USD', 'zh');
    expect(spoken[0]).toBe('收到转账金额 5.00 美元，请您确认');
    speakReceived(5, 'USD', 'en');
    expect(spoken[1]).toBe('Received transfer amount $5.00, please confirm.');
    speakReceived(5, 'USD', 'km');
    expect(spoken[2]).toBe('បានទទួលចំនួនទឹកប្រាក់ផ្ទេរ 5.00 ដុល្លារ សូមបញ្ជាក់');
    speakReceived(20000, 'KHR', 'km');
    expect(spoken[3]).toBe('បានទទួលចំនួនទឹកប្រាក់ផ្ទេរ 20,000 រៀល សូមបញ្ជាក់');
  });

  it('persists the selected language', () => {
    expect(getTtsLang()).toBe('km');
    setTtsLang('en');
    expect(getTtsLang()).toBe('en');
    setTtsLang('km');
    expect(getTtsLang()).toBe('km');
    setTtsLang('zh');
    expect(getTtsLang()).toBe('zh');
  });
});
