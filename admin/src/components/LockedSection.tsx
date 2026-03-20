import React from 'react';
import styled from 'styled-components';
import { Box, Flex, Typography } from '@strapi/design-system';
import { Lock } from '@strapi/icons';

const Container = styled(Box)`
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  // box-shadow: ${({ theme }) => theme.colors.neutral900} 0px 1px 4px 0px;
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
      {/* HEADER - Always visible and above the blur */}
      <HeaderBox>
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
                variant="delta"
                fontWeight="bold"
                textColor={isLocked ? "neutral500" : "neutral800"}
                style={{
                    fontSize: '14px',
                }}
            >
                {title}
            </Typography>

            <Typography
                variant="pi"
                textColor={isLocked ? "neutral500" : "neutral600"}
                style={{
                    fontSize: '12px',
                    marginTop: '4px',
                    display: 'block',
                }}
            >
                {description}
            </Typography>
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
        {/* The overlay is now INSIDE this box, covering only the children */}
        {isLocked && (
          <BlurOverlay>
            <Flex direction="column" alignItems="center" gap={2}>
              <LockCircle>
                <Lock width={16} />
              </LockCircle>

              <Typography
                variant="omega"
                textColor="neutral600"
                style={{ fontSize: '13px', textAlign: 'center' }}
              >
                Fill in <Typography fontWeight="bold" textColor="neutral800" style={{ fontSize: '13px' }}>Base Domain</Typography>,{' '}
                <Typography fontWeight="bold" textColor="neutral800" style={{ fontSize: '13px' }}>OpenAI API Key</Typography> and{' '}
                <Typography fontWeight="bold" textColor="neutral800" style={{ fontSize: '13px' }}>Contact Link</Typography> first.
              </Typography>
            </Flex>
          </BlurOverlay>
        )}

        <Box
          style={{
            opacity: isLocked ? 0.35 : 1,
            pointerEvents: isLocked ? 'none' : 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Container>
  );
};

export default LockedSection;