import React, { useState } from 'react';
import { Box, Flex, Typography, Button } from '@strapi/design-system';
import { Plus, Pencil, Trash, Drag } from '@strapi/icons';
import styled from 'styled-components';

interface SuggestedQuestionsProps {
  questions: string[];
  onAdd: (val: string) => void;
  onEdit: (index: number, val: string) => void;
  onRemove: (index: number) => void;
  onReorder: (newQuestions: string[]) => void;
}

const EmptyState = styled(Box)`
  padding-top: 28px;
  padding-bottom: 28px;
  padding-left: 24px;
  padding-right: 24px;
  text-align: center;
`;

const QuestionRow = styled(Flex)<{ $isDragging: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  background: ${({ $isDragging, theme }) => ($isDragging ? theme.colors.neutral100 : 'transparent')};
`;

const DragHandle = styled(Box)`
  cursor: grab;
  color: ${({ theme }) => theme.colors.neutral400};
`;

const NumberBadge = styled(Box)`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.secondary100};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary600};
`;

const EditInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid ${({ theme }) => theme.colors.primary600};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral800};
  background: ${({ theme }) => theme.colors.neutral0};
  outline: none;
  box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary100};
`;

const EditFlex = styled(Flex)`
  flex: 1;
`;

const SaveEditButton = styled(Button)`
  padding: 6px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary600};
  color: ${({ theme }) => theme.colors.neutral0};
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
`;

const CancelEditButton = styled(Button)`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral600};
  cursor: pointer;
  font-size: 12px;

  &:hover,
  &:focus,
  &:active {
    background: transparent !important;
    color: ${({ theme }) => theme.colors.neutral600} !important;
    border-color: ${({ theme }) => theme.colors.neutral200} !important;
    box-shadow: none !important;
  }
`;

const QuestionText = styled(Box)`
  flex: 1;
`;

const ActionIcons = styled(Flex)<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition: opacity 0.2s;
`;

const IconBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
`;

const EditIconBtn = styled(IconBtn)`
  color: ${({ theme }) => theme.colors.neutral600};
  &:hover {
    background: ${({ theme }) => theme.colors.primary100};
  }
`;

const TrashIconBtn = styled(IconBtn)`
  color: ${({ theme }) => theme.colors.danger600};
  &:hover {
    background: ${({ theme }) => theme.colors.danger100};
  }
`;

const AddInputRow = styled(Flex)`
  padding: 16px 24px;
`;

const AddInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid ${({ theme }) => theme.colors.primary600};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral800};
  background: ${({ theme }) => theme.colors.neutral0};
  outline: none;
  box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary100};
`;

const AddButtonRow = styled(Box)`
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 24px;
  padding-right: 24px;
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

const SuggestedQuestions = ({
  questions,
  onAdd,
  onEdit,
  onRemove,
  onReorder,
}: SuggestedQuestionsProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleStartEdit = (index: number, q: string) => {
    setIsAdding(false);
    setEditingIndex(index);
    setTempValue(q);
  };

  const handleStartAdd = () => {
    setEditingIndex(null);
    setIsAdding(true);
    setTempValue('');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...questions];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onReorder(newItems);
  };

  const handleAddSubmit = () => {
    if (tempValue.trim()) onAdd(tempValue);
    setIsAdding(false);
    setTempValue('');
  };

  const handleSaveEdit = (index: number) => {
    onEdit(index, tempValue);
    setEditingIndex(null);
    setTempValue('');
  };

  return (
    <Box>
      {questions.length === 0 && !isAdding && (
        <EmptyState textAlign="center">
          <Typography textColor="neutral600" style={{ fontSize: '13px' }}>
            No suggested questions yet.
          </Typography>
        </EmptyState>
      )}

      {questions.map((q, index) => (
        <QuestionRow
          key={`${q}-${index}`}
          alignItems="center"
          draggable={editingIndex === null && !isAdding}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, index)}
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, index)}
          onDragEnd={() => setDraggedIndex(null)}
          paddingLeft={6}
          paddingRight={6}
          paddingBottom={4}
          paddingTop={4}
          gap={3}
          $isDragging={draggedIndex === index}
        >
          <DragHandle>
            <Drag />
          </DragHandle>

          <NumberBadge>{index + 1}</NumberBadge>

          {editingIndex === index ? (
            <EditFlex gap={2}>
              <EditInput
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(index)}
              />
              <SaveEditButton onClick={() => handleSaveEdit(index)}>Save</SaveEditButton>
              <CancelEditButton onClick={() => setEditingIndex(null)}>Cancel</CancelEditButton>
            </EditFlex>
          ) : (
            <>
              <QuestionText>
                <Typography textColor="neutral800" style={{ fontSize: '13px' }}>
                  {q}
                </Typography>
              </QuestionText>

              <ActionIcons gap={1} $visible={hoveredIndex === index}>
                <EditIconBtn onClick={() => handleStartEdit(index, q)}>
                  <Pencil width="13" height="13" />
                </EditIconBtn>
                <TrashIconBtn onClick={() => onRemove(index)}>
                  <Trash width="13" height="13" />
                </TrashIconBtn>
              </ActionIcons>
            </>
          )}
        </QuestionRow>
      ))}

      {isAdding ? (
        <AddInputRow paddingLeft={6} paddingRight={6} paddingTop={4} paddingBottom={4} gap={3}>
          <AddInput
            autoFocus
            placeholder="Type a question and press Enter..."
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
          />
          <SaveEditButton onClick={handleAddSubmit}>Add</SaveEditButton>
          <CancelEditButton onClick={() => setIsAdding(false)}>Cancel</CancelEditButton>
        </AddInputRow>
      ) : (
        <AddButtonRow>
          <GhostAddButton type="button" onClick={handleStartAdd}>
            <Plus width={12} height={12} />
            Add question
          </GhostAddButton>
        </AddButtonRow>
      )}
    </Box>
  );
};

export default SuggestedQuestions;
