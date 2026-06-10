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
import ResponseTemplates, {
  type CollectionMeta,
  type FieldMeta,
  type GlobalPermissions,
} from "../components/ResponseTemplates";
import SuggestedQuestions from "../components/SuggestedQuestions";
import AiInstructions from "../components/AiInstructions";
import SetupProgress from "../components/SetupProgress";
import LockedSection from "../components/LockedSection";

type FormValues = {
  openaiKey: string;
  baseDomain: string;
  contactLink: string;
  privacyPolicyUrl: string;
  systemInstructions: string;
  responseInstructions: string;
  suggestedQuestions: string[];
  activeCollectionUids: string[];
  cardStyles: Record<string, string>;
  permissions: GlobalPermissions;
};

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

const ALLOWED_SUB_FIELD_TYPES = [
  "string",
  "text",
  "email",
  "uid",
  "integer",
  "biginteger",
  "decimal",
  "float",
  "boolean",
  "enumeration",
  "date",
  "datetime",
  "media",
];

function permKey(uid: string, fieldName: string): string {
  return `${uid}.${fieldName}`;
}

function buildCollectionMeta(allCts: any[]): CollectionMeta[] {
  return allCts.map((ct: any) => {
    const fields: FieldMeta[] = (ct.attributes || [])
      .filter((attr: any) => !SYSTEM_FIELDS.includes(attr.name))
      .map((attr: any): FieldMeta => {
        const base: FieldMeta = {
          name: attr.name,
          type: attr.type,
        };

        if (attr.type === "relation" && attr.target) {
          base.relationTarget = attr.target;
          const relatedCt = allCts.find((c: any) => c.uid === attr.target);
          if (relatedCt && Array.isArray(relatedCt.attributes)) {
            base.relationSubFieldNames = relatedCt.attributes
              .filter(
                (subAttr: any) =>
                  !SYSTEM_FIELDS.includes(subAttr.name) &&
                  ALLOWED_SUB_FIELD_TYPES.includes(subAttr.type),
              )
              .map((subAttr: any) => subAttr.name);
          }
        }

        return base;
      });

    return {
      uid: ct.uid,
      name: ct.displayName,
      fields,
    };
  });
}

function buildPermissionsFromSaved(
  allCollectionMeta: CollectionMeta[],
  savedConfig: Record<string, string[]>,
  savedRelationConfig: Record<string, Record<string, string[]>>,
): GlobalPermissions {
  const perms: GlobalPermissions = {};

  for (const col of allCollectionMeta) {
    for (const field of col.fields) {
      if (field.type !== "relation") {
        perms[permKey(col.uid, field.name)] = false;
      }
      if (
        field.type === "relation" &&
        field.relationTarget &&
        field.relationSubFieldNames
      ) {
        for (const sf of field.relationSubFieldNames) {
          perms[permKey(field.relationTarget, sf)] = false;
        }
      }
    }
  }

  for (const [uid, enabledFields] of Object.entries(savedConfig)) {
    for (const fieldName of enabledFields) {
      const key = permKey(uid, fieldName);
      if (key in perms) perms[key] = true;
    }
  }

  for (const col of allCollectionMeta) {
    const relConf = savedRelationConfig[col.uid] || {};
    for (const field of col.fields) {
      if (field.type !== "relation" || !field.relationTarget) continue;
      const enabledSubFields = relConf[field.name] || [];
      for (const sf of enabledSubFields) {
        const key = permKey(field.relationTarget, sf);
        if (key in perms) perms[key] = true;
      }
    }
  }

  return perms;
}

function serializePermissions(
  activeCollectionUids: string[],
  allCollectionMeta: CollectionMeta[],
  permissions: GlobalPermissions,
): {
  config: Record<string, string[]>;
  relationConfig: Record<string, Record<string, string[]>>;
} {
  const config: Record<string, string[]> = {};

  for (const uid of activeCollectionUids) {
    const col = allCollectionMeta.find((c) => c.uid === uid);
    if (!col) continue;

    const enabledFields: string[] = [];
    for (const field of col.fields) {
      if (field.type === "relation") continue;
      if (permissions[permKey(uid, field.name)] === true) {
        enabledFields.push(field.name);
      }
    }
    if (enabledFields.length > 0) config[uid] = enabledFields;
  }

  const relationConfig: Record<string, Record<string, string[]>> = {};

  for (const uid of activeCollectionUids) {
    const col = allCollectionMeta.find((c) => c.uid === uid);
    if (!col) continue;

    const relFields: Record<string, string[]> = {};
    for (const field of col.fields) {
      if (
        field.type !== "relation" ||
        !field.relationTarget ||
        !field.relationSubFieldNames
      )
        continue;
      const enabled = field.relationSubFieldNames.filter(
        (sf) => permissions[permKey(field.relationTarget!, sf)] === true,
      );
      if (enabled.length > 0) relFields[field.name] = enabled;
    }
    if (Object.keys(relFields).length > 0) relationConfig[uid] = relFields;
  }

  return { config, relationConfig };
}

function countEnabledForCollection(
  col: CollectionMeta,
  permissions: GlobalPermissions,
): number {
  return col.fields.filter(
    (f) =>
      f.type !== "relation" && permissions[permKey(col.uid, f.name)] === true,
  ).length;
}

function normalizeDomain(url: string): string {
  if (!url) return "";
  let normalized = url.trim().toLowerCase();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }
  return normalized.replace(/\/+$/, "");
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
  const [allCollectionMeta, setAllCollectionMeta] = useState<CollectionMeta[]>(
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
      privacyPolicyUrl: "",
      systemInstructions: "",
      responseInstructions: "",
      suggestedQuestions: [],
      activeCollectionUids: [],
      cardStyles: {},
      permissions: {},
    },
  });

  const values = watch();
  const isLocked =
    !values.baseDomain || !values.openaiKey || !values.contactLink;

  const activeCollections = values.activeCollectionUids
    .map((uid) => {
      const meta = allCollectionMeta.find((c) => c.uid === uid);
      if (!meta) return null;
      return { ...meta, cardStyle: values.cardStyles[uid] };
    })
    .filter(Boolean) as (CollectionMeta & { cardStyle?: string })[];

  const addableCollections = allCollectionMeta.filter(
    (c) =>
      c.uid !== "plugin::nui-strapi-chatbot-plugin.faqqa" &&
      !values.activeCollectionUids.includes(c.uid),
  );

  const init = async () => {
    try {
      const { data } = await get("/nui-strapi-chatbot-plugin/collections");
      const settings = data.settings || {};
      const savedConfig: Record<string, string[]> = settings.config || {};
      const savedRelationConfig: Record<
        string,
        Record<string, string[]>
      > = settings.relationConfig || {};
      const savedStyles: Record<string, string> = settings.cardStyles || {};

      const normalizedBase = normalizeDomain(settings.baseDomain || "");

      if (normalizedBase) {
        fetch(`${normalizedBase}/card-mapping.json`, { cache: "no-store" })
          .then((res) => (res.ok || res.status === 304 ? res.json() : null))
          .then((d) => {
            if (d) setCardOptions(d);
          })
          .catch(() => setCardOptions([]));
      }

      const allCts: any[] = data.contentTypes || [];
      const meta = buildCollectionMeta(allCts);
      setAllCollectionMeta(meta);

      const permissions = buildPermissionsFromSaved(
        meta,
        savedConfig,
        savedRelationConfig,
      );

      const activeUids = Object.keys(savedConfig).filter((uid) =>
        meta.some((c) => c.uid === uid),
      );

      setSavedOpenaiKey(settings.openaiKey || "");

      reset({
        openaiKey: settings.openaiKey || "",
        baseDomain: normalizedBase,
        contactLink: settings.contactLink || "",
        privacyPolicyUrl: settings.privacyPolicyUrl || "",
        systemInstructions: settings.systemInstructions || "",
        responseInstructions: settings.responseInstructions || "",
        suggestedQuestions: settings.suggestedQuestions || [],
        activeCollectionUids: activeUids,
        cardStyles: savedStyles,
        permissions,
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
    const errors: string[] = [];
    for (const uid of data.activeCollectionUids) {
      const col = allCollectionMeta.find((c) => c.uid === uid);
      if (!col) continue;
      const hasEnabled = col.fields.some(
        (f) =>
          f.type !== "relation" &&
          data.permissions[permKey(uid, f.name)] === true,
      );
      if (!hasEnabled) errors.push(col.name);
    }

    if (errors.length > 0) {
      setCollectionError(
        `Please select at least one field for: ${errors.join(", ")}`,
      );
      return;
    }
    setCollectionError("");

    try {
      const normalizedDomain = normalizeDomain(data.baseDomain);
      const { config, relationConfig } = serializePermissions(
        data.activeCollectionUids,
        allCollectionMeta,
        data.permissions,
      );

      await post("/nui-strapi-chatbot-plugin/collections", {
        data: {
          config,
          cardStyles: data.cardStyles,
          relationConfig,
          openaiKey: data.openaiKey,
          systemInstructions: data.systemInstructions,
          responseInstructions: data.responseInstructions,
          baseDomain: normalizedDomain,
          contactLink: data.contactLink,
          privacyPolicyUrl: data.privacyPolicyUrl,
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

  const handleSetPermission = (key: string, value: boolean) => {
    const current = getValues("permissions");
    setValue(
      "permissions",
      { ...current, [key]: value },
      { shouldDirty: true },
    );
    setCollectionError("");
  };

  const handleSetManyPermissions = (keys: string[], value: boolean) => {
    const current = getValues("permissions");
    const updated = { ...current };
    for (const key of keys) updated[key] = value;
    setValue("permissions", updated, { shouldDirty: true });
    setCollectionError("");
  };

  const handleAddCollection = (uid: string) => {
    const current = getValues("activeCollectionUids");
    if (current.includes(uid)) return;
    setValue("activeCollectionUids", [...current, uid], { shouldDirty: true });
  };

  const handleRemoveCollection = (uid: string) => {
    const currentUids = getValues("activeCollectionUids");
    const currentPerms = getValues("permissions");
    const col = allCollectionMeta.find((c) => c.uid === uid);

    const updatedUids = currentUids.filter((u) => u !== uid);

    const updatedPerms = { ...currentPerms };
    if (col) {
      for (const field of col.fields) {
        if (field.type !== "relation") {
          updatedPerms[permKey(uid, field.name)] = false;
        }
      }
    }

    setValue("activeCollectionUids", updatedUids, { shouldDirty: true });
    setValue("permissions", updatedPerms, { shouldDirty: true });
  };

  const handleUpdateCardStyle = (uid: string, style: string) => {
    const current = getValues("cardStyles");
    setValue("cardStyles", { ...current, [uid]: style }, { shouldDirty: true });
  };

  const activeCollectionsForProgress = activeCollections.map((col) => ({
    uid: col.uid,
    name: col.name,
    enabledCount: countEnabledForCollection(col, values.permissions),
  }));

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
            collections={activeCollectionsForProgress}
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
            privacyPolicyUrl={values.privacyPolicyUrl}
            onManage={(type, value = "") => {
              if (type === "key")
                setValue("openaiKey", value, { shouldDirty: true });
              if (type === "domain")
                setValue("baseDomain", value, { shouldDirty: true });
              if (type === "contact")
                setValue("contactLink", value, { shouldDirty: true });
              if (type === "privacy")
                setValue("privacyPolicyUrl", value, { shouldDirty: true });
            }}
          />

          <LockedSection
            title="Response Templates"
            description="Define which data fields and card layouts the AI can use in structured responses."
            isLocked={isLocked}
            error={collectionError}
          >
            <ResponseTemplates
              collections={activeCollections}
              availableCollections={addableCollections}
              permissions={values.permissions}
              cardOptions={cardOptions}
              onSetPermission={handleSetPermission}
              onSetManyPermissions={handleSetManyPermissions}
              onRemoveCollection={handleRemoveCollection}
              onUpdateCardStyle={handleUpdateCardStyle}
              onAddCollection={handleAddCollection}
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
