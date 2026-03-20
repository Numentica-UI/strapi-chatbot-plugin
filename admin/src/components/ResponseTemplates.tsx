import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Typography, Flex, Checkbox, Accordion } from '@strapi/design-system';
import { Plus, Trash, Information } from '@strapi/icons';
import { useTheme } from 'styled-components';

const CustomText = styled.span<{ weight?: number; size?: string; lh?: string; color?: string }>`
  font-weight: ${({ weight }) => weight || 400};
  font-size: ${({ size }) => size || '13px'};
  line-height: ${({ lh }) => lh || 'normal'};
  color: ${({ color, theme }) =>
    color ? theme.colors[color as keyof typeof theme.colors] || color : theme.colors.neutral800};
`;

const ActionsContainer = styled(Flex)`
  opacity: 0.6;
  transition: opacity 0.2s ease;
  &:hover {
    opacity: 1;
  }
`;

const StyledAccordionItem = styled(Accordion.Item)`
  margin: 0 !important;
  padding: 0 !important;
  border-top: none !important;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200} !important;
  transition: background 0.2s ease;

  &[data-state='open'] {
    background: ${({ theme }) => theme.colors.primary100} !important;
  }

  &,
  &:hover,
  &:focus,
  &:active,
  &:focus-within,
  &[data-state='open'] {
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  & > div {
    border-top: none !important;
  }
`;

const HeaderRow = styled(Flex)`
  width: 100%;
  min-height: 65px;
  padding-right: 24px;
  padding-left: 24px;
  justify-content: space-between;
  background: transparent;

  ${StyledAccordionItem}[data-state='open'] & {
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
  }
`;

const StyledTrigger = styled(Accordion.Trigger)`
  flex: 1;
  background: transparent !important;
  border: none !important;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 0;
  outline: none !important;
  box-shadow: none !important;
  & > svg:last-child {
    display: none;
  }
`;

const StyledHeader = styled(Accordion.Header)<{ $isOpen: boolean }>`
  background: ${({ theme, $isOpen }) =>
    $isOpen ? theme.colors.primary100 : theme.colors.neutral0} !important;
  &:hover {
    background: ${({ theme, $isOpen }) =>
      $isOpen ? theme.colors.primary100 : theme.colors.neutral0} !important;
  }
`;

const SectionTitle = styled(Typography)`
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral500};
  letter-spacing: 0.05em;
  margin-bottom: 16px;
  display: block;
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: 14px;
  background: ${({ theme }) => theme.colors.neutral200};
  margin: 0 4px;
`;

const CardStyleButton = styled.button<{ active?: boolean }>`
  padding: 4px 16px;
  border-radius: 8px;
  border: 1px solid
    ${({ active, theme }) => (active ? theme.colors.primary600 : theme.colors.neutral200)};
  background: ${({ active, theme }) => (active ? theme.colors.neutral100 : theme.colors.neutral0)};
  color: ${({ active, theme }) => (active ? theme.colors.primary600 : theme.colors.neutral700)};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary600};
    color: ${({ theme }) => theme.colors.primary600};
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.danger200};
  &:hover {
    color: ${({ theme }) => theme.colors.danger600};
    background: ${({ theme }) => theme.colors.danger100};
    border-radius: 8px;
  }
`;

const EmptyStateWrapper = styled(Flex)`
  padding: 48px 24px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.neutral0};
`;

const InfoCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.neutral100};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.neutral500};
  margin-bottom: 16px;
`;

const AddButtonWrapper = styled(Box)`
  padding: 12px 24px;
  background: ${({ theme }) => theme.colors.neutral0};
`;

const GhostAddButton = styled.button`
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary600};
  font-weight: 500;
  font-size: 13px;
  line-height: 19.5px;
  &:hover {
    text-decoration: underline;
  }
`;

const AddActionRow = styled(Flex)`
  padding: 16px 24px;
  gap: 12px;
  background: ${({ theme }) => theme.colors.neutral0};
  margin-top: 4px;
`;

const InlineSelect = styled.select`
  flex: 1;
  padding: 8px 40px 8px 12px;
  border-radius: 8px;
  border: 1.5px solid ${({ theme }) => theme.colors.primary600};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral800};
  outline: none;
  background: ${({ theme }) => theme.colors.neutral0};
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 14px;
`;

const SubmitButton = styled.button`
  background: ${({ theme }) => theme.colors.primary600};
  color: ${({ theme }) => theme.colors.neutral0};
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  &:hover {
    opacity: 0.9;
  }
`;

const CancelButton = styled.button`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  padding: 8px 16px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.neutral700};
  font-weight: 500;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
`;

interface ResponseTemplatesProps {
  collections: any[];
  availableCollections: any[];
  onToggleField: (uid: string, fieldName: string) => void;
  onToggleAll: (uid: string, value: boolean) => void;
  cardOptions: { id: string; label: string }[];
  onRemoveCollection: (uid: string) => void;
  onUpdateCardStyle: (uid: string, style: string) => void;
  onAddCollection: (uid: string) => void;
}

const ResponseTemplates = ({
  collections,
  availableCollections,
  onToggleField,
  onToggleAll,
  cardOptions,
  onRemoveCollection,
  onUpdateCardStyle,
  onAddCollection,
}: ResponseTemplatesProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUid, setSelectedUid] = useState('');
  const [openItem, setOpenItem] = useState<string | undefined>();
  const theme = useTheme();

  const handleAdd = () => {
    if (selectedUid) {
      onAddCollection(selectedUid);
      setOpenItem(selectedUid);
    }
    setIsAdding(false);
    setSelectedUid('');
  };

  return (
    <>
      <Accordion.Root
        value={openItem}
        onValueChange={setOpenItem}
        style={{ border: 'none', boxShadow: 'none' }}
      >
        {collections.map((c) => {
          const enabledCount = c.fields.filter((f: any) => f.enabled).length;
          const totalCount = c.fields.length;
          const cardLabel = cardOptions.find((opt) => opt.id === c.cardStyle)?.label || 'None';
          const isOpen = openItem === c.uid;

          return (
            <StyledAccordionItem key={c.uid} value={c.uid}>
              <StyledHeader $isOpen={isOpen} style={{ border: 'none' }}>
                <HeaderRow alignItems="center">
                  <StyledTrigger>
                    <Box>
                      <CustomText
                        weight={600}
                        color={isOpen ? 'primary600' : 'neutral800'}
                        size="13px"
                        lh="19.5px"
                      >
                        {c.name}
                      </CustomText>
                      <CustomText
                        weight={400}
                        size="11px"
                        lh="16.5px"
                        color="neutral500"
                        style={{ display: 'block' }}
                      >
                        {enabledCount} of {totalCount} fields active · {cardLabel}
                      </CustomText>
                    </Box>
                  </StyledTrigger>
                  <ActionsContainer>
                    <ActionButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCollection(c.uid);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = theme.colors.danger100)
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: theme.colors.danger600,
                      }}
                    >
                      <Trash width="13" height="13" />
                    </ActionButton>
                  </ActionsContainer>
                </HeaderRow>
              </StyledHeader>
              <Accordion.Content style={{ border: 'none' }}>
                <Box padding={6} background="transparent">
                  <SectionTitle>FIELDS</SectionTitle>
                  <Flex gap={4} wrap="wrap" marginBottom={6} alignItems="center">
                    <Flex gap={2} alignItems="center">
                      <Checkbox
                        checked={enabledCount === totalCount}
                        onCheckedChange={(val: boolean) => onToggleAll(c.uid, val)}
                      />
                      <CustomText size="13px" weight={500}>
                        All
                      </CustomText>
                    </Flex>
                    <VerticalDivider />
                    {c.fields.map((f: any) => (
                      <Flex
                        key={f.name}
                        gap={2}
                        alignItems="center"
                        style={{ minHeight: '1.5rem' }}
                      >
                        <Checkbox
                          checked={f.enabled}
                          onCheckedChange={() => onToggleField(c.uid, f.name)}
                        />
                        <CustomText size="13px">{f.name}</CustomText>
                      </Flex>
                    ))}
                  </Flex>
                  <SectionTitle>CARD STYLE</SectionTitle>
                  <Flex gap={2}>
                    <CardStyleButton
                      type="button"
                      active={!c.cardStyle}
                      onClick={() => onUpdateCardStyle(c.uid, '')}
                    >
                      None
                    </CardStyleButton>
                    {cardOptions.map((opt) => (
                      <CardStyleButton
                        key={opt.id}
                        type="button"
                        active={c.cardStyle === opt.id}
                        onClick={() => onUpdateCardStyle(c.uid, opt.id)}
                      >
                        {opt.label}
                      </CardStyleButton>
                    ))}
                  </Flex>
                </Box>
              </Accordion.Content>
            </StyledAccordionItem>
          );
        })}
      </Accordion.Root>

      {collections.length === 0 && !isAdding && (
        <EmptyStateWrapper>
          <InfoCircle>
            <Information width={18} height={18} />
          </InfoCircle>
          <CustomText size="13px" color="neutral600">
            No collections yet. Add one to get started.
          </CustomText>
        </EmptyStateWrapper>
      )}

      {isAdding ? (
        <AddActionRow alignItems="center">
          <InlineSelect value={selectedUid} onChange={(e) => setSelectedUid(e.target.value)}>
            <option value="">Select a collection type...</option>
            {availableCollections.map((ac) => (
              <option key={ac.uid} value={ac.uid}>
                {ac.name}
              </option>
            ))}
          </InlineSelect>
          <SubmitButton type="button" onClick={handleAdd}>
            Add
          </SubmitButton>
          <CancelButton type="button" onClick={() => setIsAdding(false)}>
            Cancel
          </CancelButton>
        </AddActionRow>
      ) : (
        availableCollections.length > 0 && (
          <AddButtonWrapper>
            <GhostAddButton
              type="button"
              onClick={() => {
                setIsAdding(true);
                setOpenItem(undefined);
              }}
            >
              <Plus width={12} /> Add collection
            </GhostAddButton>
          </AddButtonWrapper>
        )
      )}
    </>
  );
};

export default ResponseTemplates;
