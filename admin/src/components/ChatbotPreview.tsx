import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Typography, Flex, Button, TextInput } from '@strapi/design-system';
import { Message, Cross, PaperPlane, ArrowClockwise, ChevronDown } from '@strapi/icons';
import { useForm } from 'react-hook-form';

type ChatMessage = { text: string; isUser: boolean };
type ChatFormValues = { message: string };

const ChatWindowWrapper = styled(Box)<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 380px;
  height: 500px;
  z-index: 1000;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  transform-origin: bottom right;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ $isOpen }) =>
    $isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)'};
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
`;

const FloatingButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.primary600};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};
  transition: transform 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary700};
    transform: scale(1.05);
  }
`;

const ChatLayout = styled(Flex)`
  height: 100%;
`;

const IconButton = styled(Box).attrs({ as: 'button' })`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
`;

const MessagesArea = styled(Box)`
  flex: 1;
  overflow-y: auto;
`;

const MessageBubble = styled(Box)<{ $isUser: boolean }>`
  align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  max-width: 85%;
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const InputBar = styled(Box)`
  border-top: 1px solid #f0f0f5;
`;

const InputGrow = styled(Box)`
  flex-grow: 1;
`;

const SendButton = styled(Button)`
  height: 40px;
`;

const ChatbotPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: 'Hello! You can test the chatbot preview here.', isUser: false },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<ChatFormValues>({
    defaultValues: { message: '' },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const onSend = async ({ message }: ChatFormValues) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { text: message, isUser: true }]);
    reset();

    try {
      const res = await fetch('/api/faq-ai-bot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
      });

      if (!res.ok) throw new Error('Request failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let botMessage = '';

      setMessages((prev) => [...prev, { text: '', isUser: false }]);

      let isCardsEvent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (let rawLine of lines) {
          const line = rawLine.replace(/\r/g, '');
          if (!line) continue;

          if (line.startsWith('event: cards')) {
            isCardsEvent = true;
            continue;
          }

          if (isCardsEvent && line.startsWith('data: ')) {
            isCardsEvent = false;
            continue;
          }

          if (line.includes('[DONE]')) return;

          if (line.startsWith('data: ')) {
            const token = line.replace('data: ', '');
            botMessage += token;

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { text: botMessage, isUser: false };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { text: 'Error contacting chatbot', isUser: false }]);
    }
  };

  const handleClearHistory = () => {
    setMessages([{ text: 'Hello! You can test the chatbot preview here.', isUser: false }]);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(onSend)();
    }
  };

  return (
    <>
      <FloatingButton onClick={handleToggle} title="Toggle Chatbot Preview">
        {isOpen ? <ChevronDown width={24} height={24} /> : <Message width={28} height={28} />}
      </FloatingButton>

      <ChatWindowWrapper $isOpen={isOpen} background="neutral0" hasRadius>
        <ChatLayout direction="column" alignItems="stretch">
          {/* Header */}
          <Box padding={4} background="primary600">
            <Flex justifyContent="space-between" alignItems="center">
              <Flex gap={2}>
                <Message color="neutral0" width={18} />
                <Typography fontWeight="bold" textColor="neutral0">
                  Chatbot Preview
                </Typography>
                <IconButton onClick={handleClearHistory} title="Clear History">
                  <ArrowClockwise color="neutral0" width={14} />
                </IconButton>
              </Flex>

              <IconButton onClick={handleClose} title="Close Chat">
                <Cross color="neutral0" width={14} />
              </IconButton>
            </Flex>
          </Box>

          {/* Messages */}
          <MessagesArea ref={scrollRef} padding={4} background="neutral100">
            <Flex direction="column" alignItems="stretch" gap={3}>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={idx}
                  padding={3}
                  hasRadius
                  background={msg.isUser ? 'primary600' : 'neutral0'}
                  shadow="filterShadow"
                  $isUser={msg.isUser}
                >
                  <Typography textColor={msg.isUser ? 'neutral0' : 'neutral800'}>
                    {msg.text}
                  </Typography>
                </MessageBubble>
              ))}
            </Flex>
          </MessagesArea>

          {/* Input */}
          <InputBar padding={3} background="neutral0">
            <Flex gap={2} alignItems="center">
              <InputGrow>
                <TextInput
                  placeholder="Type a message..."
                  {...register('message')}
                  onKeyDown={handleKeyDown}
                />
              </InputGrow>
              <SendButton onClick={handleSubmit(onSend)} startIcon={<PaperPlane />}>
                Send
              </SendButton>
            </Flex>
          </InputBar>
        </ChatLayout>
      </ChatWindowWrapper>
    </>
  );
};

export default ChatbotPreview;
