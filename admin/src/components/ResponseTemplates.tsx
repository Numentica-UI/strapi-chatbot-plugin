import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  Box,
  Typography,
  Flex,
  Checkbox,
  Accordion,
} from "@strapi/design-system";
import {
  Plus,
  Trash,
  Information,
  ChevronUp,
  ChevronDown,
} from "@strapi/icons";

export interface FieldMeta {
  name: string;
  type?: string;
  relationTarget?: string;
  relationSubFieldNames?: string[];
}

export interface CollectionMeta {
  uid: string;
  name: string;
  fields: FieldMeta[];
  cardStyle?: string;
}

export type GlobalPermissions = Record<string, boolean>;

interface ResponseTemplatesProps {
  collections: CollectionMeta[];
  availableCollections: CollectionMeta[];
  permissions: GlobalPermissions;
  cardOptions: { id: string; label: string }[];
  onSetPermission: (key: string, value: boolean) => void;
  onSetManyPermissions: (keys: string[], value: boolean) => void;
  onRemoveCollection: (uid: string) => void;
  onUpdateCardStyle: (uid: string, style: string) => void;
  onAddCollection: (uid: string) => void;
}

function permKey(uid: string, fieldName: string): string {
  return `${uid}.${fieldName}`;
}

function resolveSubFieldKey(targetUid: string, subFieldName: string): string {
  return permKey(targetUid, subFieldName);
}

type TriState = "checked" | "indeterminate" | "unchecked";

function triStateFromKeys(
  keys: string[],
  permissions: GlobalPermissions,
): TriState {
  const knownKeys = keys.filter((k) => k in permissions);
  if (knownKeys.length === 0) return "unchecked";
  const enabled = knownKeys.filter((k) => permissions[k] === true).length;
  if (enabled === 0) return "unchecked";
  if (enabled === knownKeys.length) return "checked";
  return "indeterminate";
}

const HiddenNativeCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
`;

const IndeterminateBox = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.primary600};
  border: 1px solid ${({ theme }) => theme.colors.primary600};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
`;

const DashLine = styled.div`
  width: 12px;
  height: 1.5px;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: 1px;
`;

function TriStateCheckbox({
  state,
  onChange,
}: {
  state: TriState;
  onChange: (selectAll: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === "indeterminate";
      ref.current.checked = state === "checked";
    }
  }, [state]);

  if (state === "indeterminate") {
    return (
      <>
        {/* Hidden native input so the DOM indeterminate property is set */}
        <HiddenNativeCheckbox
          type="checkbox"
          ref={ref}
          checked={false}
          onChange={() => onChange(true)}
        />
        {/* Visual representation matching Strapi's checkbox */}
        <IndeterminateBox onClick={() => onChange(true)}>
          <DashLine />
        </IndeterminateBox>
      </>
    );
  }

  return (
    <Checkbox
      checked={state === "checked"}
      onCheckedChange={() => onChange(state !== "checked")}
    />
  );
}

const CustomText = styled.span<{
  weight?: number;
  size?: string;
  lh?: string;
  color?: string;
}>`
  font-weight: ${({ weight }) => weight || 400};
  font-size: ${({ size }) => size || "13px"};
  line-height: ${({ lh }) => lh || "normal"};
  color: ${({ color, theme }) =>
    color
      ? theme.colors[color as keyof typeof theme.colors] || color
      : theme.colors.neutral800};
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
  &[data-state="open"] {
    background: ${({ theme }) => theme.colors.primary100} !important;
  }
  &,
  &:hover,
  &:focus,
  &:active,
  &:focus-within,
  &[data-state="open"] {
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
    ${({ active, theme }) =>
      active ? theme.colors.primary600 : theme.colors.neutral200};
  background: ${({ active, theme }) =>
    active ? theme.colors.neutral100 : theme.colors.neutral0};
  color: ${({ active, theme }) =>
    active ? theme.colors.primary600 : theme.colors.neutral700};
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.danger600};
  &:hover {
    color: ${({ theme }) => theme.colors.danger600};
    background: ${({ theme }) => theme.colors.danger100};
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
  font-family: "Inter", sans-serif;
  font-size: 13px;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  font-family: "Inter", sans-serif;
  font-size: 13px;
  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
`;

const AccordionRoot = styled(Accordion.Root)`
  border: none;
  box-shadow: none;
`;

const AccordionContent = styled(Accordion.Content)`
  border: none;
`;

const FieldsRow = styled(Flex)`
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
`;

const FieldItem = styled(Flex)`
  gap: 8px;
  align-items: center;
  min-height: 1.5rem;
`;

const CardStyleRow = styled(Flex)`
  gap: 8px;
`;

const RelationToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0 2px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary600};
  line-height: 1;
  &:hover {
    opacity: 0.7;
  }
`;

const RelationSubPanel = styled(Box)`
  width: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: 8px;
  padding: 16px 20px;
  margin-top: 12px;
  margin-bottom: 4px;
  overflow: hidden;
  animation: slideDown 0.2s ease;
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const RelationSubPanelTitle = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral500};
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 12px;
  text-transform: uppercase;
`;

const SubFieldsRow = styled(Flex)`
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
`;

function labelFromUid(uid: string): string {
  const parts = uid?.split("::") ?? [];
  const rest = parts[1] ?? uid;
  const name = rest.split(".")[0] ?? rest;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const ResponseTemplates = ({
  collections,
  availableCollections,
  permissions,
  cardOptions,
  onSetPermission,
  onSetManyPermissions,
  onRemoveCollection,
  onUpdateCardStyle,
  onAddCollection,
}: ResponseTemplatesProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUid, setSelectedUid] = useState("");
  const [openItem, setOpenItem] = useState<string | undefined>();
  const [openRelations, setOpenRelations] = useState<Record<string, boolean>>(
    {},
  );

  const toggleRelationPanel = (collectionUid: string, fieldName: string) => {
    const key = `${collectionUid}::${fieldName}`;
    setOpenRelations((prev) => {
      if (prev[key]) return {};
      return { [key]: true };
    });
  };

  const isRelationOpen = (collectionUid: string, fieldName: string) =>
    !!openRelations[`${collectionUid}::${fieldName}`];

  const handleAdd = () => {
    if (selectedUid) onAddCollection(selectedUid);
    setIsAdding(false);
    setSelectedUid("");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setSelectedUid("");
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setSelectedUid("");
    setOpenItem(undefined);
  };

  return (
    <>
      <AccordionRoot value={openItem} onValueChange={setOpenItem}>
        {collections.map((collection) => {
          const { uid, name, fields, cardStyle } = collection;
          const isOpen = openItem === uid;

          const nonRelationFields = fields.filter((f) => f.type !== "relation");
          const enabledNonRelation = nonRelationFields.filter(
            (f) => permissions[permKey(uid, f.name)] === true,
          ).length;
          const totalNonRelation = nonRelationFields.length;

          const allFieldKeys = fields.flatMap((f) => {
            if (f.type === "relation") {
              if (f.relationTarget && f.relationSubFieldNames?.length) {
                return f.relationSubFieldNames
                  .map((sf) => resolveSubFieldKey(f.relationTarget!, sf))
                  .filter((k) => k in permissions);
              }
              return [];
            }
            return [permKey(uid, f.name)];
          });

          const collectionTriState = triStateFromKeys(
            allFieldKeys,
            permissions,
          );

          const cardLabel = Array.isArray(cardOptions)
            ? cardOptions.find((opt) => opt.id === cardStyle)?.label || "None"
            : "None";

          return (
            <StyledAccordionItem key={uid} value={uid}>
              <StyledHeader $isOpen={isOpen} style={{ border: "none" }}>
                <HeaderRow alignItems="center">
                  <StyledTrigger>
                    <Box>
                      <CustomText
                        weight={600}
                        color={isOpen ? "primary600" : "neutral800"}
                        size="13px"
                        lh="19.5px"
                      >
                        {name}
                      </CustomText>
                      <CustomText
                        weight={400}
                        size="11px"
                        lh="16.5px"
                        color="neutral500"
                        style={{ display: "block" }}
                      >
                        {enabledNonRelation} of {totalNonRelation} fields active
                        · {cardLabel}
                      </CustomText>
                    </Box>
                  </StyledTrigger>
                  <ActionsContainer>
                    <ActionButton
                      type="button"
                      onClick={() => onRemoveCollection(uid)}
                    >
                      <Trash width="13" height="13" />
                    </ActionButton>
                  </ActionsContainer>
                </HeaderRow>
              </StyledHeader>

              <AccordionContent>
                <Box padding={6} background="transparent">
                  <SectionTitle>FIELDS</SectionTitle>

                  <FieldsRow>
                    {/* ── "All" checkbox for the whole collection ── */}
                    <Flex gap={2} alignItems="center">
                      <TriStateCheckbox
                        state={collectionTriState}
                        onChange={(selectAll) =>
                          onSetManyPermissions(allFieldKeys, selectAll)
                        }
                      />
                      <CustomText size="13px" weight={500}>
                        All
                      </CustomText>
                    </Flex>
                    <VerticalDivider />

                    {fields.map((field) => {
                      const isRelation = field.type === "relation";

                      let fieldChecked = false;
                      let fieldIndeterminate = false;

                      if (
                        isRelation &&
                        field.relationTarget &&
                        field.relationSubFieldNames?.length
                      ) {
                        const subKeys = field.relationSubFieldNames
                          .map((sf) =>
                            resolveSubFieldKey(field.relationTarget!, sf),
                          )
                          .filter((k) => k in permissions);
                        const ts = triStateFromKeys(subKeys, permissions);
                        fieldChecked = ts === "checked";
                        fieldIndeterminate = ts === "indeterminate";
                      } else {
                        fieldChecked =
                          permissions[permKey(uid, field.name)] === true;
                      }

                      const fieldState: TriState = fieldIndeterminate
                        ? "indeterminate"
                        : fieldChecked
                          ? "checked"
                          : "unchecked";

                      const relationOpen =
                        isRelation && isRelationOpen(uid, field.name);

                      return (
                        <FieldItem key={field.name}>
                          <TriStateCheckbox
                            state={fieldState}
                            onChange={(selectAll) => {
                              if (
                                isRelation &&
                                field.relationTarget &&
                                field.relationSubFieldNames?.length
                              ) {
                                const subKeys = field.relationSubFieldNames.map(
                                  (sf) =>
                                    resolveSubFieldKey(
                                      field.relationTarget!,
                                      sf,
                                    ),
                                );
                                onSetManyPermissions(subKeys, selectAll);
                              } else {
                                onSetPermission(
                                  permKey(uid, field.name),
                                  selectAll,
                                );
                              }
                            }}
                          />
                          <CustomText size="13px">{field.name}</CustomText>

                          {isRelation &&
                            field.relationSubFieldNames &&
                            field.relationSubFieldNames.length > 0 && (
                              <RelationToggleButton
                                type="button"
                                title={`${relationOpen ? "Hide" : "Show"} ${field.name} fields`}
                                onClick={() =>
                                  toggleRelationPanel(uid, field.name)
                                }
                              >
                                {relationOpen ? (
                                  <ChevronUp width="12" height="12" />
                                ) : (
                                  <ChevronDown width="12" height="12" />
                                )}
                              </RelationToggleButton>
                            )}
                        </FieldItem>
                      );
                    })}
                  </FieldsRow>

                  {/* ── Relation sub-panels ── */}
                  {fields.map((field) => {
                    if (
                      field.type !== "relation" ||
                      !field.relationTarget ||
                      !field.relationSubFieldNames?.length ||
                      !isRelationOpen(uid, field.name)
                    )
                      return null;

                    const targetUid = field.relationTarget;
                    const subFieldNames = field.relationSubFieldNames;

                    const subKeys = subFieldNames
                      .map((sf) => resolveSubFieldKey(targetUid, sf))
                      .filter((k) => k in permissions);

                    const allSubTs = triStateFromKeys(subKeys, permissions);
                    const panelLabel = labelFromUid(targetUid);

                    return (
                      <RelationSubPanel key={`subpanel-${field.name}`}>
                        <RelationSubPanelTitle>
                          {panelLabel} fields
                          <span
                            style={{
                              fontWeight: 400,
                              opacity: 0.6,
                              marginLeft: 6,
                            }}
                          >
                            (same as {panelLabel} collection)
                          </span>
                        </RelationSubPanelTitle>
                        <SubFieldsRow>
                          {/* All for this relation */}
                          <Flex gap={2} alignItems="center">
                            <TriStateCheckbox
                              state={allSubTs}
                              onChange={(selectAll) =>
                                onSetManyPermissions(subKeys, selectAll)
                              }
                            />
                            <CustomText size="13px" weight={500}>
                              All
                            </CustomText>
                          </Flex>
                          <VerticalDivider />

                          {subFieldNames.map((sf) => {
                            const key = resolveSubFieldKey(targetUid, sf);
                            const isEnabled = permissions[key] === true;
                            return (
                              <FieldItem key={sf}>
                                <Checkbox
                                  checked={isEnabled}
                                  onCheckedChange={(val: boolean) =>
                                    onSetPermission(key, val)
                                  }
                                />
                                <CustomText size="13px">{sf}</CustomText>
                              </FieldItem>
                            );
                          })}
                        </SubFieldsRow>
                      </RelationSubPanel>
                    );
                  })}

                  <Box paddingTop={6}>
                    <SectionTitle>CARD STYLE</SectionTitle>
                    <CardStyleRow>
                      <CardStyleButton
                        type="button"
                        active={!cardStyle}
                        onClick={() => onUpdateCardStyle(uid, "")}
                      >
                        None
                      </CardStyleButton>
                      {(Array.isArray(cardOptions) ? cardOptions : []).map(
                        (option) => (
                          <CardStyleButton
                            key={option.id}
                            type="button"
                            active={cardStyle === option.id}
                            onClick={() => onUpdateCardStyle(uid, option.id)}
                          >
                            {option.label}
                          </CardStyleButton>
                        ),
                      )}
                    </CardStyleRow>
                  </Box>
                </Box>
              </AccordionContent>
            </StyledAccordionItem>
          );
        })}
      </AccordionRoot>

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
          <InlineSelect
            value={selectedUid}
            onChange={(e) => setSelectedUid(e.target.value)}
          >
            {availableCollections.length === 0 ? (
              <option value="" disabled>
                No collections available to add
              </option>
            ) : (
              <>
                <option value="">Select a collection type...</option>
                {availableCollections.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name}
                  </option>
                ))}
              </>
            )}
          </InlineSelect>
          <SubmitButton
            type="button"
            onClick={handleAdd}
            disabled={!selectedUid || availableCollections.length === 0}
          >
            Add
          </SubmitButton>
          <CancelButton type="button" onClick={handleCancel}>
            Cancel
          </CancelButton>
        </AddActionRow>
      ) : (
        <AddButtonWrapper>
          <GhostAddButton type="button" onClick={handleStartAdd}>
            <Plus width={12} /> Add collection
          </GhostAddButton>
        </AddButtonWrapper>
      )}
    </>
  );
};

export default ResponseTemplates;
