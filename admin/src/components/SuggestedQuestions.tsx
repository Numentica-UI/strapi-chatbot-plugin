import React, { useState } from 'react';
import { Box, Flex, Typography, Button } from '@strapi/design-system';
import { Plus, Pencil, Trash, Drag } from '@strapi/icons';
import { useTheme } from 'styled-components';

interface SuggestedQuestionsProps {
  questions: string[];
  onAdd: (val: string) => void;
  onEdit: (index: number, val: string) => void;
  onRemove: (index: number) => void;
  onReorder: (newQuestions: string[]) => void;
}

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

  const theme = useTheme();

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
      {/* EMPTY STATE */}
      {questions.length === 0 && !isAdding && (
        <Box paddingTop={7} paddingBottom={7} paddingLeft={6} paddingRight={6} textAlign="center">
          <Typography textColor="neutral600" style={{ fontSize: '13px' }}>
            No suggested questions yet.
          </Typography>
        </Box>
      )}

      {/* QUESTIONS LIST */}
      {questions.map((q, index) => {
        const showActions = hoveredIndex === index || editingIndex === index;

        return (
          <Flex
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
            background={draggedIndex === index ? 'neutral100' : 'transparent'}
            style={{
              borderBottom: `1px solid ${theme.colors.neutral150}`,
            }}
          >
            {/* DRAG HANDLE */}
            <Box cursor="grab" color="neutral400">
              <Drag />
            </Box>

            {/* NUMBER BADGE */}
            <Box
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: theme.colors.secondary100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: theme.colors.primary600,
              }}
            >
              {index + 1}
            </Box>

            {/* EDIT MODE */}
            {editingIndex === index ? (
              <Flex flex={1} gap={2}>
                <input
                  autoFocus
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(index)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${theme.colors.primary600}`,
                    fontSize: '13px',
                    color: theme.colors.neutral800,
                    background: theme.colors.neutral0,
                    outline: 'none',
                    boxShadow: `0 0 0 3px ${theme.colors.primary100}`,
                  }}
                />

                <Button
                  onClick={() => handleSaveEdit(index)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: theme.colors.primary600,
                    color: theme.colors.neutral0,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  Save
                </Button>

                <Button
                  onClick={() => setEditingIndex(null)}
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
                </Button>
              </Flex>
            ) : (
              <>
                {/* QUESTION TEXT */}
                <Box flex={1}>
                  <Typography textColor="neutral800" style={{ fontSize: '13px' }}>
                    {q}
                  </Typography>
                </Box>

                {/* ACTION ICONS */}
                <Flex
                  gap={1}
                  style={{
                    opacity: hoveredIndex === index ? 1 : 0,
                    pointerEvents: hoveredIndex === index ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <button
                    onClick={() => handleStartEdit(index, q)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = theme.colors.primary100)
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: theme.colors.neutral600,
                    }}
                  >
                    <Pencil width="13" height="13" />
                  </button>

                  <button
                    onClick={() => onRemove(index)}
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
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: theme.colors.danger600,
                    }}
                  >
                    <Trash width="13" height="13" />
                  </button>
                </Flex>
              </>
            )}
          </Flex>
        );
      })}

      {/* ADD NEW QUESTION */}
      {isAdding ? (
        <Flex paddingLeft={6} paddingRight={6} paddingTop={4} paddingBottom={4} gap={3}>
          <input
            autoFocus
            placeholder="Type a question and press Enter..."
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1.5px solid ${theme.colors.primary600}`,
              fontSize: '13px',
              color: theme.colors.neutral800,
              background: theme.colors.neutral0,
              outline: 'none',
              boxShadow: `0 0 0 3px ${theme.colors.primary100}`,
            }}
          />

          <Button
            onClick={handleAddSubmit}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme.colors.primary600,
              color: theme.colors.neutral0,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Add
          </Button>

          <Button
            onClick={() => setIsAdding(false)}
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
          </Button>
        </Flex>
      ) : (
        <Box
          paddingTop={3}
          paddingBottom={3}
          paddingLeft={6}
          paddingRight={6}
          style={{
            background: theme.colors.neutral0,
          }}
        >
          <button
            type="button"
            onClick={handleStartAdd}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: theme.colors.primary600,
              fontWeight: 500,
              fontSize: '13px',
              lineHeight: '19.5px',
            }}
          >
            <Plus width={12} height={12} />
            Add question
          </button>
        </Box>
      )}
    </Box>
  );
};

export default SuggestedQuestions;
