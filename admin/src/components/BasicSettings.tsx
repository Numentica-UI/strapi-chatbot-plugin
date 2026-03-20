import React from 'react';
import { Box, Typography } from '@strapi/design-system';
import { Pencil, Check, Eye, EyeStriked, WarningCircle, Paragraph } from '@strapi/icons';
import { useTheme } from 'styled-components';

type SettingType = 'key' | 'domain' | 'contact';

interface BasicSettingsProps {
  openaiKey: string;
  savedOpenaiKey: string;
  baseDomain: string;
  contactLink: string;
  onManage: (type: SettingType, value?: string) => void;
}

interface TokenUsage {
  tokensUsed: number;
  estimatedCost: number;
}

interface SettingRowProps {
  title: string;
  description: string;
  value: string;
  type: SettingType;
  hovered: SettingType | null;
  editing: SettingType | null;
  saved: SettingType | null;
  tempValue: string;
  tokenUsage?: TokenUsage;
  setHovered: (v: SettingType | null) => void;
  setEditing: (v: SettingType | null) => void;
  setSaved: (v: SettingType | null) => void;
  setTempValue: (v: string) => void;
  onManage: (type: SettingType, value?: string) => void;
  isLast?: boolean;
}

const SettingRow = ({
  title,
  description,
  value,
  type,
  hovered,
  editing,
  saved,
  tokenUsage,
  tempValue,
  setHovered,
  setEditing,
  setSaved,
  setTempValue,
  onManage,
  isLast = false,
}: SettingRowProps) => {
  const [showKey, setShowKey] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [keyError, setKeyError] = React.useState<string | null>(null);
  const theme = useTheme();

  const handleSave = async () => {
    if (type === 'key' && tempValue.trim()) {
      setIsValidating(true);
      setKeyError(null);
      try {
        const res = await fetch('/api/faq-ai-bot/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: tempValue }),
        });
        const data = await res.json();
        if (!data.valid) {
          setKeyError(data.message);
          setIsValidating(false);
          return;
        }
      } catch {
        setKeyError('Could not validate key. Check your connection.');
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    onManage(type, tempValue);
    setEditing(null);
    setSaved(type);
    setKeyError(null);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <Box
      onMouseEnter={() => setHovered(type)}
      onMouseLeave={() => setHovered(null)}
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px 24px',
        borderBottom: isLast ? 'none' : `1px solid ${theme.colors.neutral150}`,
        background: editing === type ? theme.colors.primary100 : theme.colors.neutral0,
        transition: 'background 0.2s ease',
        alignItems: 'flex-start',
      }}
    >
      {/* LEFT */}
      <Box style={{ width: '168px', flexShrink: 0 }}>
        <Typography
          variant="omega"
          fontWeight="600"
          textColor="neutral800"
          style={{ fontSize: '13px', display: 'block', marginBottom: '2px' }}
        >
          {title}
        </Typography>
        <Typography
          variant="pi"
          textColor="neutral500"
          style={{ lineHeight: 1.4, fontSize: '11px' }}
        >
          {description}
        </Typography>
      </Box>

      {/* RIGHT */}
      <Box style={{ flex: 1 }}>
        {editing === type ? (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Input row */}
            <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '360px',
                  borderRadius: '8px',
                  border: `1.5px solid ${keyError ? theme.colors.danger600 : theme.colors.primary600}`,
                  background: theme.colors.neutral0,
                  overflow: 'hidden',
                }}
              >
                <input
                  autoFocus
                  type={type === 'key' && !showKey ? 'password' : 'text'}
                  placeholder={
                    type === 'domain'
                      ? 'https://your-domain.com'
                      : type === 'contact'
                        ? 'https://your-domain.com/contact'
                        : 'sk-…'
                  }
                  value={tempValue}
                  onChange={(e) => {
                    setTempValue(e.target.value);
                    setKeyError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: theme.colors.neutral800,
                    background: 'transparent',
                  }}
                />
                {type === 'key' && (
                  <button
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      paddingRight: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showKey ? (
                      <Eye width={16} height={16} fill={theme.colors.neutral500} />
                    ) : (
                      <EyeStriked width={16} height={16} fill={theme.colors.neutral500} />
                    )}
                  </button>
                )}
              </Box>

              <button
                onClick={handleSave}
                disabled={isValidating}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: theme.colors.primary600,
                  color: theme.colors.neutral0,
                  border: 'none',
                  cursor: isValidating ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                  opacity: isValidating ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {isValidating ? 'Validating...' : 'Save'}
              </button>

              <button
                onClick={() => {
                  setEditing(null);
                  setKeyError(null);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.neutral200}`,
                  background: 'transparent',
                  color: theme.colors.neutral600,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Cancel
              </button>
            </Box>

            {/* Error message — only for key type */}
            {keyError && type === 'key' && (
              <Box
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: theme.colors.danger100,
                  border: `1px solid ${theme.colors.danger200}`,
                  maxWidth: '480px',
                }}
              >
                <Typography variant="pi" textColor="danger600" style={{ fontSize: '12px' }}>
                  {keyError}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          /* ── VIEW MODE ── same structure for all three types ── */
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Row 1: value/badge + saved + edit/add button */}
            <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Value or NOT CONFIGURED badge */}
              {value ? (
                <Typography
                  variant="omega"
                  textColor={type === 'key' ? 'neutral500' : 'primary600'}
                  style={{
                    fontSize: '13px',
                    maxWidth: '320px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {type === 'key' ? '••••••••••••' : value}
                </Typography>
              ) : (
                <Box
                  style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    background: theme.colors.danger100,
                  }}
                >
                  <Typography
                    variant="pi"
                    textColor="danger600"
                    fontWeight="600"
                    style={{ fontSize: '11px', letterSpacing: '0.04em' }}
                  >
                    NOT CONFIGURED
                  </Typography>
                </Box>
              )}

              {/* Saved indicator */}
              {saved === type && (
                <Box style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check width={12} height={12} fill={theme.colors.success600} />
                  <Typography
                    variant="pi"
                    textColor="success600"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    Saved
                  </Typography>
                </Box>
              )}

              {/* Edit / Add button */}
              <button
                onClick={() => {
                  setEditing(type);
                  setTempValue(value);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.primary600}`,
                  color: theme.colors.primary600,
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'transparent',
                  cursor: 'pointer',
                  opacity: hovered === type || saved === type || !value ? 1 : 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <Pencil width={11} height={11} />
                {value ? 'Edit' : 'Add'}
              </button>
            </Box>

            {/* Row 2: token pills — only for key type when value + tokenUsage exist */}
            {type === 'key' && value && tokenUsage && (
              <Box style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Tokens Used pill */}
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: theme.colors.primary100,
                    border: `1px solid ${theme.colors.secondary100}`,
                    borderRadius: '8px',
                    padding: '5px 10px',
                  }}
                >
                  <Box
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: theme.colors.secondary100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Paragraph width={11} height={11} fill={theme.colors.primary600} />
                  </Box>
                  <Typography
                    variant="pi"
                    style={{
                      fontSize: '11px',
                      color: theme.colors.neutral500,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Tokens Used
                  </Typography>
                  <Box style={{ width: 1, height: 14, background: theme.colors.secondary100 }} />
                  <Typography
                    variant="pi"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: theme.colors.neutral800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tokenUsage.tokensUsed.toLocaleString()}
                  </Typography>
                </Box>

                {/* Est. Cost pill */}
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: theme.colors.primary100,
                    border: `1px solid ${theme.colors.secondary100}`,
                    borderRadius: '8px',
                    padding: '5px 10px',
                  }}
                >
                  <Box
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: theme.colors.success100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <WarningCircle width={11} height={11} fill={theme.colors.success600} />
                  </Box>
                  <Typography
                    variant="pi"
                    style={{
                      fontSize: '11px',
                      color: theme.colors.neutral500,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Est. Cost
                  </Typography>
                  <Box style={{ width: 1, height: 14, background: theme.colors.secondary100 }} />
                  <Typography
                    variant="pi"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: theme.colors.neutral800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ${tokenUsage.estimatedCost.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const BasicSettings = ({
  openaiKey,
  savedOpenaiKey,
  baseDomain,
  contactLink,
  onManage,
}: BasicSettingsProps) => {
  const [hovered, setHovered] = React.useState<SettingType | null>(null);
  const [editing, setEditing] = React.useState<SettingType | null>(null);
  const [saved, setSaved] = React.useState<SettingType | null>(null);
  const [tempValue, setTempValue] = React.useState('');
  const theme = useTheme();

  const [tokenUsage, setTokenUsage] = React.useState<TokenUsage | undefined>(undefined);

  React.useEffect(() => {
    fetch('/api/faq-ai-bot/usage')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.tokensUsed === 'number') {
          setTokenUsage({
            tokensUsed: data.tokensUsed,
            estimatedCost: typeof data.estimatedCost === 'number' ? data.estimatedCost : 0,
          });
        }
      })
      .catch((e) => console.error('[usage fetch error]', e));
  }, [savedOpenaiKey]);

  return (
    <Box
      style={{
        background: theme.colors.neutral0,
        border: `1px solid ${theme.colors.neutral200}`,
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}
    >
      {/* HEADER */}
      <Box style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.colors.neutral150}` }}>
        <div>
          <Typography
            as="h2"
            textColor="neutral800"
            style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}
          >
            Basic Settings
          </Typography>
          <Typography
            as="p"
            textColor="neutral600"
            style={{ fontSize: '12px', marginTop: '3px', lineHeight: 1.5, marginBottom: 0 }}
          >
            Core identity and access configuration for your chatbot.
          </Typography>
        </div>
      </Box>

      <SettingRow
        type="domain"
        title="Base Domain"
        description="Root URL used to scope chatbot context"
        value={baseDomain}
        hovered={hovered}
        editing={editing}
        saved={saved}
        tempValue={tempValue}
        setHovered={setHovered}
        setEditing={setEditing}
        setSaved={setSaved}
        setTempValue={setTempValue}
        onManage={onManage}
      />

      <SettingRow
        type="key"
        title="OpenAI API Key"
        description="Stored encrypted — never exposed to users"
        value={openaiKey}
        tokenUsage={tokenUsage}
        hovered={hovered}
        editing={editing}
        saved={saved}
        tempValue={tempValue}
        setHovered={setHovered}
        setEditing={setEditing}
        setSaved={setSaved}
        setTempValue={setTempValue}
        onManage={onManage}
      />

      <SettingRow
        type="contact"
        title="Contact Link"
        description="Shown as 'Talk to Support' in the chatbot"
        value={contactLink}
        hovered={hovered}
        editing={editing}
        saved={saved}
        tempValue={tempValue}
        setHovered={setHovered}
        setEditing={setEditing}
        setSaved={setSaved}
        setTempValue={setTempValue}
        onManage={onManage}
        isLast
      />
    </Box>
  );
};

export default BasicSettings;
