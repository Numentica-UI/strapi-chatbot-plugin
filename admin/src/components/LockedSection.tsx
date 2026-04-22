import React from "react";
import styled from "styled-components";
import { Box, Flex, Typography } from "@strapi/design-system";
import { Lock } from "@strapi/icons";

const Container = styled(Box)`
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: ${({ theme }) => theme.colors.neutral0};
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const LockBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.neutral100};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};

  span {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.neutral500};
    font-weight: 500;
  }

  svg {
    color: ${({ theme }) => theme.colors.neutral500};
  }
`;

const BlurOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.neutral100};
  opacity: 0.88;
  backdrop-filter: blur(2px);
`;

const LockCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary100};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;

  svg {
    color: ${({ theme }) => theme.colors.primary600};
  }
`;

const HeaderBox = styled(Box)`
  padding: 16px 24px 18px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
`;

const SectionTitle = styled(Typography)<{ $isLocked: boolean }>`
  font-size: 14px;
`;

const SectionDesc = styled(Typography)<{ $isLocked: boolean }>`
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

const ContentArea = styled(Box)<{ $isLocked: boolean }>`
  opacity: ${({ $isLocked }) => ($isLocked ? 0.35 : 1)};
  pointer-events: ${({ $isLocked }) => ($isLocked ? "none" : "auto")};
`;

const OverlayText = styled(Typography)`
  font-size: 13px;
  text-align: center;
`;

const BoldInline = styled(Typography)`
  font-size: 13px;
`;

interface LockedSectionProps {
  title: string;
  description: string;
  isLocked: boolean;
  children: React.ReactNode;
}

const LockedSection = ({
  title,
  description,
  isLocked,
  children,
}: LockedSectionProps) => {
  return (
    <Container marginBottom={6}>
      {/* HEADER */}
      <HeaderBox>
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <SectionTitle
              variant="delta"
              fontWeight="bold"
              textColor={isLocked ? "neutral500" : "neutral800"}
              $isLocked={isLocked}
            >
              {title}
            </SectionTitle>
            <SectionDesc
              variant="pi"
              textColor={isLocked ? "neutral500" : "neutral600"}
              $isLocked={isLocked}
            >
              {description}
            </SectionDesc>
          </Box>

          {isLocked && (
            <LockBadge>
              <Lock width={11} />
              <span>Complete Basic Settings to unlock</span>
            </LockBadge>
          )}
        </Flex>
      </HeaderBox>

      {/* CONTENT AREA */}
      <Box position="relative">
        {isLocked && (
          <BlurOverlay>
            <Flex direction="column" alignItems="center" gap={2}>
              <LockCircle>
                <Lock width={16} />
              </LockCircle>
              <OverlayText variant="omega" textColor="neutral600">
                Fill in{" "}
                <BoldInline fontWeight="bold" textColor="neutral800">
                  Base Domain
                </BoldInline>
                ,{" "}
                <BoldInline fontWeight="bold" textColor="neutral800">
                  OpenAI API Key
                </BoldInline>{" "}
                and{" "}
                <BoldInline fontWeight="bold" textColor="neutral800">
                  Contact Link
                </BoldInline>{" "}
                first.
              </OverlayText>
            </Flex>
          </BlurOverlay>
        )}

        <ContentArea $isLocked={isLocked}>{children}</ContentArea>
      </Box>
    </Container>
  );
};

export default LockedSection;
