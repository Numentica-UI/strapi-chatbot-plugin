import React, { useEffect, useState } from 'react';
import { Main, Typography, Flex, Button, Box, Loader } from '@strapi/design-system';
import { Check, Information } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

import ChatbotPreview from '../components/ChatbotPreview';
import BasicSettings from '../components/BasicSettings';
import ResponseTemplates from '../components/ResponseTemplates';
import SuggestedQuestions from '../components/SuggestedQuestions';
import AiInstructions from '../components/AiInstructions';
import SetupProgress from '../components/SetupProgress';
import LockedSection from '../components/LockedSection';

type FieldConfig = {
  name: string;
  enabled: boolean;
};

type CollectionConfig = {
  uid: string;
  name: string;
  fields: FieldConfig[];
  cardStyle?: string;
};

function normalizeDomain(url: string): string {
  if (!url) return '';
  let normalized = url.trim().toLowerCase();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  normalized = normalized.replace(/\/+$/, '');
  return normalized;
}

const HomePage = () => {
  // Data States
  const [allContentTypes, setAllContentTypes] = useState<CollectionConfig[]>([]);
  const [activeCollections, setActiveCollections] = useState<CollectionConfig[]>([]);

  // Settings States
  const [openaiKey, setOpenaiKey] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [responseInstructions, setResponseInstructions] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [baseDomain, setBaseDomain] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [cardOptions, setCardOptions] = useState<any[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [originalData, setOriginalData] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedOpenaiKey, setSavedOpenaiKey] = useState('');
  const isLocked = !baseDomain || !openaiKey || !contactLink;

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  // Track Unsaved Changes
  useEffect(() => {
    const currentData = JSON.stringify({
      openaiKey,
      systemInstructions,
      responseInstructions,
      logoUrl,
      baseDomain,
      contactLink,
      suggestedQuestions,
      activeCollections,
    });

    if (originalData && currentData !== originalData) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [openaiKey, systemInstructions, responseInstructions, logoUrl, baseDomain, contactLink, suggestedQuestions, activeCollections, originalData]);

  const init = async () => {
    try {
      const { data } = await get('/faq-ai-bot/collections');
      const settings = data.settings || {};
      const savedConfig = settings.config || {};
      const savedStyles = settings.cardStyles || {};

      setOpenaiKey(settings.openaiKey || '');
      setSavedOpenaiKey(settings.openaiKey || '');
      setSystemInstructions(settings.systemInstructions || '');
      setResponseInstructions(settings.responseInstructions || '');
      setLogoUrl(settings.logoUrl || '');

      const normalizedBase = normalizeDomain(settings.baseDomain || '');
      setBaseDomain(normalizedBase);

      if (normalizedBase) {
        fetch(`${normalizedBase}/card-mapping.json`, { cache: 'no-store' })
          .then((res) => {
            if (!res.ok && res.status !== 304) throw new Error('Failed to load card mapping');
            return res.status === 304 ? null : res.json();
          })
          .then((data) => { if (data) setCardOptions(data); })
          .catch(() => setCardOptions([]));
      }

      setContactLink(settings.contactLink || '');
      setSuggestedQuestions(settings.suggestedQuestions || []);

      const SYSTEM_FIELDS = [
        'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy',
        'locale', 'localizations', '__component', 'id',
      ];

      const formattedAll: CollectionConfig[] = (data.contentTypes || []).map((ct: any) => ({
        uid: ct.uid,
        name: ct.displayName,
        cardStyle: savedStyles[ct.uid] || undefined,
        fields: ct.attributes
          .filter((attr: any) => !SYSTEM_FIELDS.includes(attr.name))
          .map((attr: any) => ({
            name: attr.name,
            enabled: savedConfig[ct.uid]?.includes(attr.name) || false,
          })),
      }));

      setAllContentTypes(formattedAll);

      const initialActive = formattedAll.filter((ct: CollectionConfig) =>
        Object.keys(savedConfig).includes(ct.uid)
      );
      setActiveCollections(initialActive);

      setOriginalData(JSON.stringify({
        openaiKey: settings.openaiKey || '',
        systemInstructions: settings.systemInstructions || '',
        responseInstructions: settings.responseInstructions || '',
        logoUrl: settings.logoUrl || '',
        baseDomain: normalizedBase,
        contactLink: settings.contactLink || '',
        suggestedQuestions: settings.suggestedQuestions || [],
        activeCollections: initialActive,
      }));

    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Error loading settings.';
      toggleNotification({ type: 'warning', message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, [get]);

  const handleUpdateCardStyle = (uid: string, style: string) => {
    setActiveCollections((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, cardStyle: style } : c))
    );
  };

  const handleRemoveCollection = (uid: string) => {
    setActiveCollections((prev) => prev.filter((c) => c.uid !== uid));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const normalizedDomain = normalizeDomain(baseDomain);
      setBaseDomain(normalizedDomain);

      const configToSave: Record<string, string[]> = {};
      const stylesToSave: Record<string, string> = {};

      activeCollections.forEach((item) => {
        const enabled = item.fields.filter((f) => f.enabled).map((f) => f.name);
        if (enabled.length > 0) configToSave[item.uid] = enabled;
        if (item.cardStyle) stylesToSave[item.uid] = item.cardStyle;
      });

      await post('/faq-ai-bot/collections', {
        config: configToSave,
        cardStyles: stylesToSave,
        openaiKey,
        systemInstructions,
        responseInstructions,
        logoUrl,
        baseDomain: normalizedDomain,
        contactLink,
        suggestedQuestions,
      });

      setIsSaved(true);
      setSavedOpenaiKey(openaiKey);
      setHasUnsavedChanges(false);
      setTimeout(() => setIsSaved(false), 3000);

      toggleNotification({ type: 'success', message: 'Settings saved successfully!' });
      await init();
    } catch {
      toggleNotification({ type: 'warning', message: 'Error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <Flex justifyContent="center" height="100vh">
        <Loader />
      </Flex>
    );

  return (
    <Main>
      {/* UNSAVED CHANGES BAR */}
      {hasUnsavedChanges && (
        <Box
          background="warning100"
          borderColor="warning200"
          style={{
            width: '100%',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: '32px',
            paddingLeft: '32px',
            borderBottomWidth: '2px',
            borderBottomStyle: 'solid',
            position: 'sticky',
            top: 0,
            zIndex: 6,
          }}
        >
          <Flex alignItems="center" gap={2}>
            <Information color="warning600" style={{ width: 18, height: 18 }} />
          <Typography
            textColor="warning600"
            style={{
              fontWeight: 500,
              fontSize: '13px',
              lineHeight: '19.5px',
            }}
          >
            You have unsaved changes
          </Typography>
        </Flex>

          <Flex gap={4}>
            <button
              onClick={() => init()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: '12px',
                color: 'inherit'
              }}
            >
              Discard
            </button>
            <Button
              onClick={save}
              background="primary600"
              style={{
                width: '87.84px',
                height: '28px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              Save All
            </Button>
          </Flex>
        </Box>
      )}

      {/* HEADER SECTION */}
      <Box
        background="neutral100"
        position="sticky"
        top={hasUnsavedChanges ? '50px' : 0}
        zIndex={6}
        paddingTop={8}
        paddingBottom={4}
      >
        <Box style={{ maxWidth: '704px', margin: '0 auto', width: '100%' }}>
          <Flex justifyContent="space-between" alignItems="baseline">
            <Box>
              <Typography textColor="neutral800" style={{ fontWeight: 700, fontSize: '20px', lineHeight: '30px', display: 'block' }}>
                Chatbot Configuration
              </Typography>
              <Box paddingTop={1}>
                <Typography textColor="neutral600" style={{ fontWeight: 400, fontSize: '13px', lineHeight: '19.5px' }}>
                  Configure your AI chatbot's identity, data, and behaviour.
                </Typography>
              </Box>
            </Box>

            <Flex alignItems="center">
              {isSaved ? (
                <Box
                  background="success100"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 14px',
                    height: '34px',
                    borderRadius: '8px',
                  }}
                >
                  <Check width={14} height={14} color="success600" />
                  <Typography textColor="success600" style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                    Saved!
                  </Typography>
                </Box>
              ) : (
                !hasUnsavedChanges && (
                  <Button
                    onClick={save}
                    startIcon={<Check width={14} height={14} />}
                    background="primary600"
                    style={{
                      border: 'none',
                      color: 'white',
                      fontSize: '13px',
                      padding: '7px 14px',
                      height: '34px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      textAlign: 'center',
                      gap: '6px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Save Settings
                  </Button>
                )
              )}
            </Flex>
          </Flex>
        </Box>
      </Box>

      <Box background="neutral100" paddingTop={6} paddingBottom={8} marginBottom={8}>
        <Box style={{ maxWidth: '704px', margin: '0 auto', width: '100%' }}>

          <SetupProgress
            baseDomain={baseDomain}
            openaiKey={openaiKey}
            contactLink={contactLink}
            collections={activeCollections}
            questions={suggestedQuestions}
            instructions={!!systemInstructions && !!responseInstructions}
          />

          <BasicSettings
            baseDomain={baseDomain}
            openaiKey={openaiKey}
            savedOpenaiKey={savedOpenaiKey}
            contactLink={contactLink}
            onManage={(type: any, value?: string) => {
              if (value !== undefined) {
                if (type === 'key') setOpenaiKey(value);
                if (type === 'domain') setBaseDomain(value);
                if (type === 'contact') setContactLink(value);
              }
            }}
          />

          <LockedSection
            title="Response Templates"
            description="Define which data fields and card layouts the AI can use in structured responses."
            isLocked={isLocked}
          >
            <ResponseTemplates
              collections={activeCollections}
              availableCollections={allContentTypes.filter(
                (c) =>
                  c.uid !== 'plugin::faq-ai-bot.faqqa' &&
                  !activeCollections.some((active) => active.uid === c.uid)
              )}
              cardOptions={cardOptions}
              onToggleField={(uid, fName) => {
                setActiveCollections((prev) =>
                  prev.map((c) =>
                    c.uid !== uid
                      ? c
                      : {
                          ...c,
                          fields: c.fields.map((f: any) =>
                            f.name === fName ? { ...f, enabled: !f.enabled } : f
                          ),
                        }
                  )
                );
              }}
              onToggleAll={(uid, val) => {
                setActiveCollections((prev) =>
                  prev.map((c) =>
                    c.uid !== uid
                      ? c
                      : {
                          ...c,
                          fields: c.fields.map((f: any) => ({ ...f, enabled: val })),
                        }
                  )
                );
              }}
              onRemoveCollection={handleRemoveCollection}
              onUpdateCardStyle={handleUpdateCardStyle}
              onAddCollection={(uid) => {
                const newlyAdded = allContentTypes.find((ct) => ct.uid === uid);
                if (newlyAdded) {
                  const formatted = {
                    ...JSON.parse(JSON.stringify(newlyAdded)),
                    cardStyle: cardOptions[0]?.id || '',
                  };
                  setActiveCollections((prev) => [...prev, formatted]);
                }
              }}
            />
          </LockedSection>

          <LockedSection
            title="Suggested Questions"
            description="Quick-tap prompts on the chatbot welcome screen to help users get started."
            isLocked={isLocked}
          >
            <SuggestedQuestions
              questions={suggestedQuestions}
              onAdd={(val: string) => setSuggestedQuestions((prev) => [...prev, val])}
              onEdit={(index: number, val: string) =>
                setSuggestedQuestions((prev) => {
                  const updated = [...prev];
                  updated[index] = val;
                  return updated;
                })
              }
              onRemove={(index: number) =>
                setSuggestedQuestions((prev) => prev.filter((_, i) => i !== index))
              }
              onReorder={(newQuestions: string[]) => setSuggestedQuestions([...newQuestions])}
            />
          </LockedSection>

          <LockedSection
            title="AI Instructions"
            description="Rules and context the AI applies before every response. One instruction per line."
            isLocked={isLocked}
          >
            <AiInstructions
              systemInstructions={systemInstructions}
              responseInstructions={responseInstructions}
              onUpdateSystem={setSystemInstructions}
              onUpdateResponse={setResponseInstructions}
            />
          </LockedSection>
        </Box>
      </Box>

      <ChatbotPreview />
    </Main>
  );
};

export { HomePage };
