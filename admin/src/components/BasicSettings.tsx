import React from "react";
import { Box, Typography } from "@strapi/design-system";
import {
  Pencil,
  Check,
  Eye,
  EyeStriked,
  WarningCircle,
  Paragraph,
} from "@strapi/icons";
import styled from "styled-components";
import { useForm } from "react-hook-form";

type SettingType = "key" | "domain" | "contact";

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
  tokenUsage?: TokenUsage;
  onManage: (type: SettingType, value?: string) => void;
  isLast?: boolean;
}

const Wrapper = styled(Box)`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
`;

const Header = styled(Box)`
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

const HeaderTitle = styled(Typography)`
  font-size: 14px;
  font-weight: 700;
  margin: 0;
`;

const HeaderDesc = styled(Typography)`
  font-size: 12px;
  margin-top: 3px;
  line-height: 1.5;
  margin-bottom: 0;
`;

const RowBox = styled(Box)<{ $isEditing: boolean; $isLast: boolean }>`
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: ${({ $isLast, theme }) =>
    $isLast ? "none" : `1px solid ${theme.colors.neutral150}`};
  background: ${({ $isEditing, theme }) =>
    $isEditing ? theme.colors.primary100 : theme.colors.neutral0};
  transition: background 0.2s ease;
  align-items: flex-start;
`;

const LeftCol = styled(Box)`
  width: 168px;
  flex-shrink: 0;
`;

const RowTitle = styled(Typography)`
  font-size: 13px;
  display: block;
  margin-bottom: 2px;
`;

const RowDesc = styled(Typography)`
  line-height: 1.4;
  font-size: 11px;
`;

const RightCol = styled(Box)`
  flex: 1;
`;

const EditColumn = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InputWrapper = styled(Box)<{ $hasError: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 360px;
  border-radius: 8px;
  border: 1.5px solid
    ${({ $hasError, theme }) =>
      $hasError ? theme.colors.danger600 : theme.colors.primary600};
  background: ${({ theme }) => theme.colors.neutral0};
  overflow: hidden;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: none;
  outline: none;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral800};
  background: transparent;
`;

const EyeButton = styled.button`
  padding-right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const SaveButton = styled.button<{ $loading: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary600};
  color: ${({ theme }) => theme.colors.neutral0};
  border: none;
  cursor: ${({ $loading }) => ($loading ? "not-allowed" : "pointer")};
  font-weight: 600;
  font-size: 12px;
  opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};
  white-space: nowrap;
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral600};
  cursor: pointer;
  font-size: 12px;
`;

const ErrorBox = styled(Box)`
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.danger100};
  border: 1px solid ${({ theme }) => theme.colors.danger200};
  max-width: 480px;
`;

const ErrorText = styled(Typography)`
  font-size: 12px;
`;

const ViewColumn = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ViewRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ValueText = styled(Typography)<{ $isKey: boolean }>`
  font-size: 13px;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NotConfiguredBadge = styled(Box)`
  padding: 2px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.danger100};
`;

const NotConfiguredText = styled(Typography)`
  font-size: 11px;
  letter-spacing: 0.04em;
`;

const SavedIndicator = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SavedText = styled(Typography)`
  font-size: 12px;
  font-weight: 500;
`;

const EditButton = styled.button<{ $visible: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.primary600};
  color: ${({ theme }) => theme.colors.primary600};
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: all 0.2s ease;
`;

const TokenPillsRow = styled(Box)`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const TokenPill = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.primary100};
  border: 1px solid ${({ theme }) => theme.colors.secondary100};
  border-radius: 8px;
  padding: 5px 10px;
`;

const TokenIconBox = styled(Box)<{ $bg: string }>`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TokenLabel = styled(Typography)`
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
`;

const TokenDivider = styled(Box)`
  width: 1px;
  height: 14px;
  background: ${({ theme }) => theme.colors.secondary100};
`;

const TokenValue = styled(Typography)`
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
`;

const SettingRow = ({
  title,
  description,
  value,
  type,
  tokenUsage,
  onManage,
  isLast = false,
}: SettingRowProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [showKey, setShowKey] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ fieldValue: string }>({
    defaultValues: { fieldValue: value },
  });

  React.useEffect(() => {
    reset({ fieldValue: value });
  }, [value, reset]);

  const onSave = async ({ fieldValue }: { fieldValue: string }) => {
    if (type === "key" && fieldValue.trim()) {
      try {
        const res = await fetch("/api/faq-ai-bot/validate-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: fieldValue }),
        });
        const data = await res.json();
        if (!data.valid) {
          setError("fieldValue", { message: data.message });
          return;
        }
      } catch {
        setError("fieldValue", {
          message: "Could not validate key. Check your connection.",
        });
        return;
      }
    }

    onManage(type, fieldValue);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({ fieldValue: value });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    reset({ fieldValue: value });
  };

  return (
    <RowBox
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      $isEditing={isEditing}
      $isLast={isLast}
    >
      {/* LEFT */}
      <LeftCol>
        <RowTitle variant="omega" fontWeight="600" textColor="neutral800">
          {title}
        </RowTitle>
        <RowDesc variant="pi" textColor="neutral500">
          {description}
        </RowDesc>
      </LeftCol>

      {/* RIGHT */}
      <RightCol>
        {isEditing ? (
          <EditColumn>
            <InputRow>
              <InputWrapper $hasError={!!errors.fieldValue}>
                <StyledInput
                  autoFocus
                  type={type === "key" && !showKey ? "password" : "text"}
                  placeholder={
                    type === "domain"
                      ? "https://your-domain.com"
                      : type === "contact"
                        ? "https://your-domain.com/contact"
                        : "sk-…"
                  }
                  {...register("fieldValue")}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(onSave)()}
                />
                {type === "key" && (
                  <EyeButton type="button" onClick={() => setShowKey(!showKey)}>
                    {showKey ? (
                      <Eye width={16} height={16} />
                    ) : (
                      <EyeStriked width={16} height={16} />
                    )}
                  </EyeButton>
                )}
              </InputWrapper>

              <SaveButton
                type="button"
                onClick={handleSubmit(onSave)}
                disabled={isSubmitting}
                $loading={isSubmitting}
              >
                {isSubmitting ? "Validating..." : "Save"}
              </SaveButton>

              <CancelButton type="button" onClick={handleCancel}>
                Cancel
              </CancelButton>
            </InputRow>

            {errors.fieldValue && type === "key" && (
              <ErrorBox>
                <ErrorText variant="pi" textColor="danger600">
                  {errors.fieldValue.message}
                </ErrorText>
              </ErrorBox>
            )}
          </EditColumn>
        ) : (
          <ViewColumn>
            <ViewRow>
              {value ? (
                <ValueText
                  variant="omega"
                  textColor={type === "key" ? "neutral500" : "primary600"}
                  $isKey={type === "key"}
                >
                  {type === "key" ? "••••••••••••" : value}
                </ValueText>
              ) : (
                <NotConfiguredBadge>
                  <NotConfiguredText
                    variant="pi"
                    textColor="danger600"
                    fontWeight="600"
                  >
                    NOT CONFIGURED
                  </NotConfiguredText>
                </NotConfiguredBadge>
              )}

              {isSaved && (
                <SavedIndicator>
                  <Check width={12} height={12} />
                  <SavedText variant="pi" textColor="success600">
                    Saved
                  </SavedText>
                </SavedIndicator>
              )}

              <EditButton
                $visible={isHovered || isSaved || !value}
                onClick={handleStartEdit}
              >
                <Pencil width={11} height={11} />
                {value ? "Edit" : "Add"}
              </EditButton>
            </ViewRow>

            {type === "key" && value && tokenUsage && (
              <TokenPillsRow>
                <TokenPill>
                  <TokenIconBox $bg="secondary100">
                    <Paragraph width={11} height={11} fill="primary600" />
                  </TokenIconBox>
                  <TokenLabel variant="pi" textColor="neutral500">
                    Tokens Used
                  </TokenLabel>
                  <TokenDivider />
                  <TokenValue variant="pi" textColor="neutral800">
                    {tokenUsage.tokensUsed.toLocaleString()}
                  </TokenValue>
                </TokenPill>

                <TokenPill>
                  <TokenIconBox $bg="success100">
                    <WarningCircle width={11} height={11} fill="success600" />
                  </TokenIconBox>
                  <TokenLabel variant="pi" textColor="neutral500">
                    Est. Cost
                  </TokenLabel>
                  <TokenDivider />
                  <TokenValue variant="pi" textColor="neutral800">
                    ${tokenUsage.estimatedCost.toFixed(2)}
                  </TokenValue>
                </TokenPill>
              </TokenPillsRow>
            )}
          </ViewColumn>
        )}
      </RightCol>
    </RowBox>
  );
};

const BasicSettings = ({
  openaiKey,
  savedOpenaiKey,
  baseDomain,
  contactLink,
  onManage,
}: BasicSettingsProps) => {
  const [tokenUsage, setTokenUsage] = React.useState<TokenUsage | undefined>(
    undefined,
  );

  React.useEffect(() => {
    fetch("/api/faq-ai-bot/usage")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.tokensUsed === "number") {
          setTokenUsage({
            tokensUsed: data.tokensUsed,
            estimatedCost:
              typeof data.estimatedCost === "number" ? data.estimatedCost : 0,
          });
        }
      })
      .catch((e) => console.error("[usage fetch error]", e));
  }, [savedOpenaiKey]);

  return (
    <Wrapper>
      <Header>
        <div>
          <HeaderTitle as="h2" textColor="neutral800">
            Basic Settings
          </HeaderTitle>
          <HeaderDesc as="p" textColor="neutral600">
            Core identity and access configuration for your chatbot.
          </HeaderDesc>
        </div>
      </Header>

      <SettingRow
        type="domain"
        title="Base Domain"
        description="Root URL used to scope chatbot context"
        value={baseDomain}
        onManage={onManage}
      />

      <SettingRow
        type="key"
        title="OpenAI API Key"
        description="Stored encrypted — never exposed to users"
        value={openaiKey}
        tokenUsage={tokenUsage}
        onManage={onManage}
      />

      <SettingRow
        type="contact"
        title="Contact Link"
        description="Shown as 'Talk to Support' in the chatbot"
        value={contactLink}
        onManage={onManage}
        isLast
      />
    </Wrapper>
  );
};

export default BasicSettings;
