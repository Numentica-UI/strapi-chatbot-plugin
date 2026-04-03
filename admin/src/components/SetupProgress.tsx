import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Box, Flex, Typography } from '@strapi/design-system';
import { CheckCircle, CrossCircle } from '@strapi/icons';

const ZapIcon = ({ width = 15, height = 15, color }: { width?: number; height?: number; color?: string }) => {
  const theme = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || theme.colors.primary600}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
};

const ProgressContainer = styled(Box)`
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: ${({ theme }) => theme.colors.neutral0};
  margin-bottom: 24px;
  overflow: hidden;
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 6px;
  background: ${({ theme }) => theme.colors.secondary100};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ percent: number; isFull: boolean }>`
  height: 100%;
  width: ${({ percent }) => percent}%;
  background: ${({ isFull, theme }) =>
    isFull
      ? `linear-gradient(90deg, ${theme.colors.success600}, ${theme.colors.success200})`
      : `linear-gradient(90deg, ${theme.colors.primary600}, ${theme.colors.primary500})`};
  transition: width 0.5s ease-in-out;
  border-radius: 999px;
`;

const StatusTag = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  background: ${({ active, theme }) => (active ? theme.colors.success100 : theme.colors.neutral100)};
  border: 1px solid
    ${({ active, theme }) => (active ? theme.colors.success200 : theme.colors.neutral150)};
  color: ${({ active, theme }) => (active ? theme.colors.success600 : theme.colors.neutral500)};

  svg {
    width: 11px;
    height: 11px;
  }
`;

const CountBadge = styled.span<{ isFull: boolean }>`
  background: ${({ isFull, theme }) => (isFull ? theme.colors.success100 : theme.colors.primary100)};
  color: ${({ isFull, theme }) => (isFull ? theme.colors.success600 : theme.colors.primary600)};
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
`;

const TitleRow = styled(Flex)`
  gap: 8px;
  align-items: center;
`;

const TitleText = styled(Typography)`
  font-size: 14px;
`;

const SubText = styled(Typography)`
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

const TagsRow = styled(Flex)`
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

interface SetupProgressProps {
  baseDomain: string;
  openaiKey: string;
  contactLink: string;
  collections: any[];
  questions: string[];
  instructions: boolean;
}

const SetupProgress = ({
  baseDomain,
  openaiKey,
  contactLink,
  collections,
  questions,
  instructions,
}: SetupProgressProps) => {
  const tasks = [
    { label: 'Base Domain', done: !!baseDomain && baseDomain !== '' },
    { label: 'OpenAI API Key', done: !!openaiKey && openaiKey !== '' },
    { label: 'Contact Link', done: !!contactLink && contactLink !== '' },
    { label: 'Collections', done: collections.length > 0 },
    { label: 'Suggested Questions', done: questions.length > 0 },
    { label: 'AI Instructions', done: instructions },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const isFull = completedCount === tasks.length;
  const percentage = (completedCount / tasks.length) * 100;

  return (
    <ProgressContainer>
      <Box padding={6}>
        <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={3}>
          <Box>
            <TitleRow>
              <ZapIcon />
              <TitleText variant="delta" fontWeight="bold" textColor="neutral800">
                Setup Progress
              </TitleText>
            </TitleRow>
            <SubText variant="pi" textColor="neutral600">
              {isFull
                ? '🎉 Your chatbot is fully configured and ready to go!'
                : "Configure your AI chatbot's identity, data, and behaviour."}
            </SubText>
          </Box>
          <CountBadge isFull={isFull}>
            {completedCount}/{tasks.length}
          </CountBadge>
        </Flex>

        <ProgressBarWrapper>
          <ProgressBar percent={percentage} isFull={isFull} />
        </ProgressBarWrapper>

        <TagsRow>
          {tasks.map((task, i) => (
            <StatusTag key={i} active={task.done}>
              {task.done ? <CheckCircle /> : <CrossCircle />}
              {task.label}
            </StatusTag>
          ))}
        </TagsRow>
      </Box>
    </ProgressContainer>
  );
};

export default SetupProgress;
