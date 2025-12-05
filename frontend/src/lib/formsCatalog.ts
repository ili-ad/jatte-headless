export type FormDef = {
  id: string;
  state: string;
  label: string;
  shortLabel: string;
  slug: string;
  kind: string;
  blurb: string;
};

export type FormSuggestion = {
  id: string;
  reason?: string;
};

export const FORM_DEFS: FormDef[] = [
  {
    id: 'FL_NOC',
    state: 'FL',
    label: 'Florida Notice of Commencement',
    shortLabel: 'Notice of Commencement',
    slug: 'notice-of-commencement',
    kind: 'noc',
    blurb: 'Record this to start the project and lock in lien priority.',
  },
  {
    id: 'FL_NTO_SUB',
    state: 'FL',
    label: 'Florida Notice to Owner (Subcontractor)',
    shortLabel: 'Subcontractor NTO',
    slug: 'notice-to-owner-sub',
    kind: 'nto',
    blurb: 'Preserves lien rights for subs and suppliers.',
  },
  {
    id: 'FL_LIEN_WAIVER_PARTIAL',
    state: 'FL',
    label: 'Florida Partial Lien Waiver',
    shortLabel: 'Partial Lien Waiver',
    slug: 'partial-lien-waiver',
    kind: 'waiver',
    blurb: 'Exchange for payment to release lien rights on completed work to date.',
  },
];

export function getFormDefById(id: string): FormDef | undefined {
  return FORM_DEFS.find((form) => form.id === id);
}

export function friendlyLabelForFormId(id: string): string {
  const def = getFormDefById(id);
  return def?.shortLabel || def?.label || id;
}
