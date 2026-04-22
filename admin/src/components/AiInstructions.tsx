import React, { useState, useEffect } from "react";
import { Box } from "@strapi/design-system";
import { Information } from "@strapi/icons";
import styled, { useTheme } from "styled-components";
import { useForm } from "react-hook-form";

interface AiInstructionsProps {
  systemInstructions: string;
  responseInstructions: string;
  onUpdateSystem: (val: string) => void;
  onUpdateResponse: (val: string) => void;
}

type FormValues = {
  systemInstructions: string;
  responseContent: string;
};

type Tone = "friendly" | "professional" | "concise";

const tonePrompts: Record<Tone, string> = {
  friendly: `Response Tone: Respond in a friendly and warm tone. Be conversational and approachable.`,
  professional: `Response Tone: Respond in a professional and formal tone. Keep responses structured and respectful.`,
  concise: `Response Tone: Respond concisely and directly. Avoid unnecessary details.`,
};

const getCleanText = (text: string | undefined) => {
  if (!text) return "";
  let cleaned = text;
  Object.values(tonePrompts).forEach((prompt) => {
    cleaned = cleaned.replace(prompt, "");
  });
  return cleaned.trim();
};

const detectTone = (text: string): Tone | null => {
  if (!text) return null;

  switch (true) {
    case text.includes(tonePrompts.friendly):
      return "friendly";
    case text.includes(tonePrompts.professional):
      return "professional";
    case text.includes(tonePrompts.concise):
      return "concise";
    default:
      return null;
  }
};

const Container = styled(Box)`
  padding: 16px 24px 20px;
`;

const SectionBlock = styled(Box)`
  margin-bottom: 20px;
`;

const LabelRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral800};
`;

const HelpText = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.neutral500};
  margin-bottom: 8px;
`;

const TextAreaWrapper = styled(Box)`
  border: 1.5px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 8px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.neutral0};
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary600};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary100};
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 10px 12px;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral800};
  line-height: 1.7;
  font-family: Inter, sans-serif;
  background: transparent;
`;

const ToneSection = styled(Box)`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

const ToneSectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral800};
  margin-bottom: 6px;
`;

const PillRow = styled(Box)`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const TonePill = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  transition: all 0.15s;
  cursor: pointer;
  border: 1.5px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary600 : theme.colors.neutral200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary100 : theme.colors.neutral0};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary600 : theme.colors.neutral600};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
`;

const AiInstructions = ({
  systemInstructions,
  responseInstructions,
  onUpdateSystem,
  onUpdateResponse,
}: AiInstructionsProps) => {
  const theme = useTheme();

  const [tone, setTone] = useState<Tone | null>(() =>
    detectTone(responseInstructions),
  );

  const { register, watch, reset } = useForm<FormValues>({
    defaultValues: {
      systemInstructions,
      responseContent: getCleanText(responseInstructions),
    },
  });

  const responseContent = watch("responseContent");

  useEffect(() => {
    reset({
      systemInstructions,
      responseContent: getCleanText(responseInstructions),
    });
    setTone(detectTone(responseInstructions));
  }, [systemInstructions, responseInstructions, reset]);

  const selectTone = (toneType: Tone) => {
    const nextTone = tone === toneType ? null : toneType;
    setTone(nextTone);

    const currentContent = responseContent.trim();
    const toneText = nextTone ? tonePrompts[nextTone] : "";
    const combined = toneText
      ? `${toneText}\n\n${currentContent}`
      : currentContent;

    onUpdateResponse(combined);
  };

  const handleFriendly = () => selectTone("friendly");
  const handleProfessional = () => selectTone("professional");
  const handleConcise = () => selectTone("concise");

  return (
    <Container>
      {/* SYSTEM INSTRUCTIONS */}
      <SectionBlock>
        <LabelRow>
          <Label>System Instructions</Label>
          <Information width={13} height={13} fill={theme.colors.neutral500} />
        </LabelRow>
        <HelpText>
          Each line is a separate instruction. Changes auto-save when you click
          elsewhere.
        </HelpText>
        <TextAreaWrapper>
          <StyledTextarea
            placeholder={`Replace Madras with Chennai\nAlways respond in English\nDon't mention competitor airlines`}
            {...register("systemInstructions", {
              onBlur: (e) => onUpdateSystem(e.target.value),
            })}
          />
        </TextAreaWrapper>
      </SectionBlock>

      {/* RESPONSE TONE */}
      <ToneSection>
        <ToneSectionTitle>Response Tone</ToneSectionTitle>
        <PillRow>
          <TonePill
            $active={tone === "friendly"}
            type="button"
            onClick={handleFriendly}
          >
            Friendly & Warm
          </TonePill>
          <TonePill
            $active={tone === "professional"}
            type="button"
            onClick={handleProfessional}
          >
            Professional
          </TonePill>
          <TonePill
            $active={tone === "concise"}
            type="button"
            onClick={handleConcise}
          >
            Concise
          </TonePill>
        </PillRow>
        <HelpText>
          Customize the AI response message. Changes auto-save when you click
          elsewhere.
        </HelpText>
        <TextAreaWrapper>
          <StyledTextarea
            placeholder={`Reply in proper formatted way.\nAlways keep in mind that you are working for ABC company.`}
            {...register("responseContent", {
              onBlur: (e) => {
                const toneText = tone ? tonePrompts[tone] : "";
                const combined = toneText
                  ? `${toneText}\n\n${e.target.value}`
                  : e.target.value;
                onUpdateResponse(combined);
              },
            })}
          />
        </TextAreaWrapper>
      </ToneSection>
    </Container>
  );
};

export default AiInstructions;
