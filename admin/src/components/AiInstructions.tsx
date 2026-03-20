import React, { useState } from 'react';
import { Box } from '@strapi/design-system';
import { Information } from '@strapi/icons';
import { useTheme } from 'styled-components';

interface AiInstructionsProps {
  systemInstructions: string;
  responseInstructions: string;
  onUpdateSystem: (val: string) => void;
  onUpdateResponse: (val: string) => void;
}

const tonePrompts: Record<string, string> = {
  friendly: `Response Tone: Respond in a friendly and warm tone. Be conversational and approachable.`,
  professional: `Response Tone: Respond in a professional and formal tone. Keep responses structured and respectful.`,
  concise: `Response Tone: Respond concisely and directly. Avoid unnecessary details.`,
};

const getCleanText = (text: string | undefined) => {
  if (!text) return '';
  let cleaned = text;
  Object.values(tonePrompts).forEach((prompt) => {
    cleaned = cleaned.replace(prompt, '');
  });
  return cleaned.trim();
};
const AiInstructions = ({
  systemInstructions,
  responseInstructions,
  onUpdateSystem,
  onUpdateResponse,
}: AiInstructionsProps) => {
  const theme = useTheme();

  const [localResponse, setLocalResponse] = useState(() => getCleanText(responseInstructions));

  const [tone, setTone] = useState<'friendly' | 'professional' | 'concise' | null>(() => {
    if (!responseInstructions) return null;
    if (responseInstructions.includes(tonePrompts.friendly)) return 'friendly';
    if (responseInstructions.includes(tonePrompts.professional)) return 'professional';
    if (responseInstructions.includes(tonePrompts.concise)) return 'concise';
    return null;
  });

  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalResponse(getCleanText(responseInstructions));
    }
  }, [responseInstructions, isFocused]);

  const selectTone = (t: 'friendly' | 'professional' | 'concise') => {
    const nextTone = tone === t ? null : t;
    setTone(nextTone);
    const toneText = nextTone ? tonePrompts[nextTone] : '';
    const cleanContent = localResponse.trim();
    const combined = toneText ? `${toneText}\n\n${cleanContent}` : cleanContent;
    onUpdateResponse(combined);
  };

  const pillStyle = (active: boolean) => ({
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    transition: 'all .15s',
    cursor: 'pointer',
    border: active
      ? `1.5px solid ${theme.colors.primary600}`
      : `1.5px solid ${theme.colors.neutral200}`,
    background: active ? theme.colors.primary100 : theme.colors.neutral0,
    color: active ? theme.colors.primary600 : theme.colors.neutral600,
    fontWeight: active ? 600 : 400,
  });

  return (
    <>
      <Box style={{ padding: '16px 24px 20px' }}>
        {/* SYSTEM INSTRUCTIONS */}
        <Box style={{ marginBottom: '20px' }}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: theme.colors.neutral800,
              }}
            >
              System Instructions
            </span>
            <Information
              width={13}
              height={13}
              fill={theme.colors.neutral500}
              color={theme.colors.neutral500}
            />
          </Box>
          <p
            style={{
              fontSize: '11px',
              color: theme.colors.neutral500,
              marginBottom: '8px',
            }}
          >
            Each line is a separate instruction. Changes auto-save when you click elsewhere.
          </p>
          <Box
            style={{
              border: `1.5px solid ${theme.colors.neutral200}`,
              borderRadius: '8px',
              padding: '8px',
              background: theme.colors.neutral0,
              transition: 'border-color .15s, box-shadow .15s',
            }}
            onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
              e.currentTarget.style.border = `1.5px solid ${theme.colors.primary600}`;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary100}`;
            }}
            onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
              e.currentTarget.style.border = `1.5px solid ${theme.colors.neutral200}`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Box
              as="textarea"
              value={systemInstructions}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onUpdateSystem(e.target.value)
              }
              placeholder={`Replace Madras with Chennai
Always respond in English
Don't mention competitor airlines`}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px 12px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontSize: '13px',
                color: theme.colors.neutral800,
                lineHeight: 1.7,
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
              }}
            />
          </Box>
        </Box>

        {/* RESPONSE TONE */}
        <Box
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.colors.neutral150}`,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: theme.colors.neutral800,
              marginBottom: '6px',
            }}
          >
            Response Tone
          </div>
          <Box style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <button style={pillStyle(tone === 'friendly')} onClick={() => selectTone('friendly')}>
              Friendly & Warm
            </button>
            <button
              style={pillStyle(tone === 'professional')}
              onClick={() => selectTone('professional')}
            >
              Professional
            </button>
            <button style={pillStyle(tone === 'concise')} onClick={() => selectTone('concise')}>
              Concise
            </button>
          </Box>
          <p
            style={{
              fontSize: '11px',
              color: theme.colors.neutral500,
              marginBottom: '8px',
            }}
          >
            Customize the AI response message. Changes auto-save when you click elsewhere.
          </p>
          <Box
            style={{
              border: `1.5px solid ${theme.colors.neutral200}`,
              borderRadius: '8px',
              padding: '8px',
              background: theme.colors.neutral0,
              transition: 'border-color .15s, box-shadow .15s',
            }}
            onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
              e.currentTarget.style.border = `1.5px solid ${theme.colors.primary600}`;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary100}`;
            }}
            onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
              e.currentTarget.style.border = `1.5px solid ${theme.colors.neutral200}`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Box
              as="textarea"
              value={localResponse}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setLocalResponse(e.target.value);
                const toneText = tone ? tonePrompts[tone] : '';
                const combined = toneText ? `${toneText}\n\n${e.target.value}` : e.target.value;
                onUpdateResponse(combined);
              }}
              placeholder={`Reply in proper formatted way.
Always keep in mind that you are wokring for ABC company.
                `}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px 12px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontSize: '13px',
                color: theme.colors.neutral800,
                lineHeight: 1.7,
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
              }}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AiInstructions;
