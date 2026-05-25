import React, { useEffect, useState } from "react";
import {
  Main,
  Typography,
  Flex,
  Button,
  Box,
  Loader,
} from "@strapi/design-system";
import { Check, Information } from "@strapi/icons";
import { useFetchClient, useNotification } from "@strapi/admin/strapi-admin";
import styled from "styled-components";
import { useForm } from "react-hook-form";

import ChatbotPreview from "../components/ChatbotPreview";
import BasicSettings from "../components/BasicSettings";
import ResponseTemplates from "../components/ResponseTemplates";
import SuggestedQuestions from "../components/SuggestedQuestions";
import AiInstructions from "../components/AiInstructions";
import SetupProgress from "../components/SetupProgress";
import LockedSection from "../components/LockedSection";

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

type FormValues = {
  openaiKey: string;
  baseDomain: string;
  contactLink: string;
  systemInstructions: string;
  responseInstructions: string;
  suggestedQuestions: string[];
  activeCollections: CollectionConfig[];
};

function normalizeDomain(url: string): string {
  if (!url) return "";
  let normalized = url.trim().toLowerCase();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

const LoaderWrapper = styled(Flex)`
  height: 100vh;
`;

const UnsavedBar = styled(Box)`
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 32px;
  padding-left: 32px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  position: sticky;
  top: 0;
  z-index: 6;
`;

const UnsavedText = styled(Typography)`
  font-weight: 500;
  font-size: 13px;
  line-height: 19.5px;
`;

const DiscardButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: Inter;
  font-weight: 500;
  font-size: 12px;
  color: inherit;
`;

const SaveAllButton = styled(Button)`
  width: 87.84px;
  height: 28px;
  border-radius: 10px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const StickyHeader = styled(Box)<{ $hasUnsaved: boolean }>`
  top: ${({ $hasUnsaved }) => ($hasUnsaved ? "50px" : "0")};
`;

const CenteredBox = styled(Box)`
  max-width: 704px;
  margin: 0 auto;
  width: 100%;
`;

const PageTitle = styled(Typography)`
  font-weight: 700;
  font-size: 20px;
  line-height: 30px;
  display: block;
`;

const PageSubtitle = styled(Typography)`
  font-weight: 400;
  font-size: 13px;
  line-height: 19.5px;
`;

const SavedBadge = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 34px;
  border-radius: 8px;
`;

const SavedBadgeText = styled(Typography)`
  font-size: 13px;
  font-weight: 500;
  font-family: Inter, sans-serif;
`;

const HomePage = () => {
  const [allContentTypes, setAllContentTypes] = useState<CollectionConfig[]>(
    [],
  );
  const [cardOptions, setCardOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedOpenaiKey, setSavedOpenaiKey] = useState("");
  const [collectionError, setCollectionError] = useState("");

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const {
    watch,
    reset,
    setValue,
    getValues,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      openaiKey: "",
      baseDomain: "",
      contactLink: "",
      systemInstructions: "",
      responseInstructions: "",
      suggestedQuestions: [],
      activeCollections: [],
    },
  });

  const values = watch();
  const isLocked =
    !values.baseDomain || !values.openaiKey || !values.contactLink;

  const init = async () => {
    try {
      const { data } = await get("/nui-strapi-chatbot-plugin/collections");
      const settings = data.settings || {};
      const savedConfig = settings.config || {};
      const savedStyles = settings.cardStyles || {};

      const normalizedBase = normalizeDomain(settings.baseDomain || "");

      if (normalizedBase) {
        fetch(`${normalizedBase}/card-mapping.json`, { cache: "no-store" })
          .then((res) => {
            if (!res.ok && res.status !== 304)
              throw new Error("Failed to load card mapping");
            return res.status === 304 ? null : res.json();
          })
          .then((data) => {
            if (data) setCardOptions(data);
          })
          .catch(() => setCardOptions([]));
      }

      const SYSTEM_FIELDS = [
        "createdAt",
        "updatedAt",
        "publishedAt",
        "createdBy",
        "updatedBy",
        "locale",
        "localizations",
        "__component",
        "id",
      ];

      const formattedAll: CollectionConfig[] = (data.contentTypes || []).map(
        (ct: any) => ({
          uid: ct.uid,
          name: ct.displayName,
          cardStyle: savedStyles[ct.uid] || undefined,
          fields: ct.attributes
            .filter((attr: any) => !SYSTEM_FIELDS.includes(attr.name))
            .map((attr: any) => ({
              name: attr.name,
              enabled: savedConfig[ct.uid]?.includes(attr.name) || false,
            })),
        }),
      );

      setAllContentTypes(formattedAll);

      const initialActive = formattedAll.filter((ct: CollectionConfig) =>
        Object.keys(savedConfig).includes(ct.uid),
      );

      setSavedOpenaiKey(settings.openaiKey || "");

      reset({
        openaiKey: settings.openaiKey || "",
        baseDomain: normalizedBase,
        contactLink: settings.contactLink || "",
        systemInstructions: settings.systemInstructions || "",
        responseInstructions: settings.responseInstructions || "",
        suggestedQuestions: settings.suggestedQuestions || [],
        activeCollections: initialActive,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error loading settings.";
      toggleNotification({ type: "warning", message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, [get]);

  const onSubmit = async (data: FormValues) => {
    // Read latest state directly - data param from handleSubmit may be stale
    const activeCollections = getValues("activeCollections");

    const collectionsWithNoFields = activeCollections.filter(
      (item) => !item.fields.some((f) => f.enabled),
    );

    if (collectionsWithNoFields.length > 0) {
      const names = collectionsWithNoFields.map((c) => c.name).join(", ");
      setCollectionError(`Please select at least one field for: ${names}`);
      return;
    }

    setCollectionError("");

    try {
      const normalizedDomain = normalizeDomain(data.baseDomain);

      const configToSave: Record<string, string[]> = {};
      const stylesToSave: Record<string, string> = {};

      data.activeCollections.forEach((item) => {
        const enabled = item.fields.filter((f) => f.enabled).map((f) => f.name);
        if (enabled.length > 0) configToSave[item.uid] = enabled;
        if (item.cardStyle) stylesToSave[item.uid] = item.cardStyle;
      });

      await post("/nui-strapi-chatbot-plugin/collections", {
        data: {
          config: configToSave,
          cardStyles: stylesToSave,
          openaiKey: data.openaiKey,
          systemInstructions: data.systemInstructions,
          responseInstructions: data.responseInstructions,
          baseDomain: normalizedDomain,
          contactLink: data.contactLink,
          suggestedQuestions: data.suggestedQuestions,
        },
      });

      setSavedOpenaiKey(data.openaiKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      toggleNotification({
        type: "success",
        message: "Settings saved successfully!",
      });

      await init();
    } catch {
      toggleNotification({
        type: "warning",
        message: "Error saving settings.",
      });
    }
  };

  if (isLoading)
    return (
      <LoaderWrapper justifyContent="center">
        <Loader />
      </LoaderWrapper>
    );

  return (
    <Main>
      {isDirty && (
        <UnsavedBar background="warning100" borderColor="warning200">
          <Flex alignItems="center" gap={2}>
            <Information color="warning600" width={18} height={18} />
            <UnsavedText textColor="warning600">
              You have unsaved changes
            </UnsavedText>
          </Flex>
          <Flex gap={4}>
            <DiscardButton onClick={init}>Discard</DiscardButton>
            <SaveAllButton
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              background="primary600"
            >
              {isSubmitting ? "Saving..." : "Save All"}
            </SaveAllButton>
          </Flex>
        </UnsavedBar>
      )}

      <StickyHeader
        background="neutral100"
        position="sticky"
        zIndex={6}
        paddingTop={8}
        paddingBottom={4}
        $hasUnsaved={isDirty}
      >
        <CenteredBox>
          <Flex justifyContent="space-between" alignItems="baseline">
            <Box>
              <PageTitle textColor="neutral800">
                Chatbot Configuration
              </PageTitle>
              <Box paddingTop={1}>
                <PageSubtitle textColor="neutral600">
                  Configure your AI chatbot's identity, data, and behaviour.
                </PageSubtitle>
              </Box>
            </Box>

            <Flex alignItems="center">
              {isSaved && (
                <SavedBadge background="success100">
                  <Check width={14} height={14} color="success600" />
                  <SavedBadgeText textColor="success600">Saved!</SavedBadgeText>
                </SavedBadge>
              )}
            </Flex>
          </Flex>
        </CenteredBox>
      </StickyHeader>

      <Box
        background="neutral100"
        paddingTop={6}
        paddingBottom={8}
        marginBottom={8}
      >
        <CenteredBox>
          <SetupProgress
            baseDomain={values.baseDomain}
            openaiKey={values.openaiKey}
            contactLink={values.contactLink}
            collections={values.activeCollections}
            questions={values.suggestedQuestions}
            instructions={
              !!values.systemInstructions && !!values.responseInstructions
            }
          />

          <BasicSettings
            baseDomain={values.baseDomain}
            openaiKey={values.openaiKey}
            savedOpenaiKey={savedOpenaiKey}
            contactLink={values.contactLink}
            onManage={(type, value = "") => {
              if (type === "key")
                setValue("openaiKey", value, { shouldDirty: true });
              if (type === "domain")
                setValue("baseDomain", value, { shouldDirty: true });
              if (type === "contact")
                setValue("contactLink", value, { shouldDirty: true });
            }}
          />

          <LockedSection
            title="Response Templates"
            description="Define which data fields and card layouts the AI can use in structured responses."
            isLocked={isLocked}
            error={collectionError}
          >
            <ResponseTemplates
              collections={values.activeCollections}
              availableCollections={allContentTypes.filter(
                (c) =>
                  c.uid !== "plugin::nui-strapi-chatbot-plugin.faqqa" &&
                  !values.activeCollections.some(
                    (active) => active.uid === c.uid,
                  ),
              )}
              cardOptions={cardOptions}
              onToggleField={(uid, fName) => {
                const current = getValues("activeCollections");
                const updated = current.map((c) =>
                  c.uid !== uid
                    ? c
                    : {
                        ...c,
                        fields: c.fields.map((f) =>
                          f.name === fName ? { ...f, enabled: !f.enabled } : f,
                        ),
                      },
                );
                setValue("activeCollections", updated, { shouldDirty: true });
                setCollectionError("");
              }}
              onToggleAll={(uid, val) => {
                const current = getValues("activeCollections");
                const updated = current.map((c) =>
                  c.uid !== uid
                    ? c
                    : {
                        ...c,
                        fields: c.fields.map((f) => ({ ...f, enabled: val })),
                      },
                );
                setValue("activeCollections", updated, { shouldDirty: true });
                setCollectionError("");
              }}
              onRemoveCollection={(uid) => {
                const current = getValues("activeCollections");
                setValue(
                  "activeCollections",
                  current.filter((c) => c.uid !== uid),
                  { shouldDirty: true },
                );
              }}
              onUpdateCardStyle={(uid, style) => {
                const current = getValues("activeCollections");
                const updated = current.map((c) =>
                  c.uid === uid ? { ...c, cardStyle: style } : c,
                );
                setValue("activeCollections", updated, { shouldDirty: true });
              }}
              onAddCollection={(uid) => {
                const current = getValues("activeCollections");
                const newlyAdded = allContentTypes.find((ct) => ct.uid === uid);
                if (newlyAdded) {
                  const formatted = {
                    ...JSON.parse(JSON.stringify(newlyAdded)),
                    cardStyle: cardOptions[0]?.id || "",
                  };
                  setValue("activeCollections", [...current, formatted], {
                    shouldDirty: true,
                  });
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
              questions={values.suggestedQuestions}
              onAdd={(val) => {
                const current = getValues("suggestedQuestions");
                setValue("suggestedQuestions", [...current, val], {
                  shouldDirty: true,
                });
              }}
              onEdit={(index, val) => {
                const current = getValues("suggestedQuestions");
                const updated = [...current];
                updated[index] = val;
                setValue("suggestedQuestions", updated, { shouldDirty: true });
              }}
              onRemove={(index) => {
                const current = getValues("suggestedQuestions");
                setValue(
                  "suggestedQuestions",
                  current.filter((_, i) => i !== index),
                  { shouldDirty: true },
                );
              }}
              onReorder={(newQuestions) =>
                setValue("suggestedQuestions", [...newQuestions], {
                  shouldDirty: true,
                })
              }
            />
          </LockedSection>

          <LockedSection
            title="AI Instructions"
            description="Rules and context the AI applies before every response. One instruction per line."
            isLocked={isLocked}
          >
            <AiInstructions
              systemInstructions={values.systemInstructions}
              responseInstructions={values.responseInstructions}
              onUpdateSystem={(val) =>
                setValue("systemInstructions", val, { shouldDirty: true })
              }
              onUpdateResponse={(val) =>
                setValue("responseInstructions", val, { shouldDirty: true })
              }
            />
          </LockedSection>
        </CenteredBox>
      </Box>

      <ChatbotPreview />
    </Main>
  );
};

export { HomePage };