export type SidecarItemDef = {
  id: string;
  kind: string;
  label: string;
  shortLabel: string;
  slug: string;
  blurb: string;
  state?: string;
};

export type SidecarSuggestion = {
  id: string;
  reason?: string;
};

export const SIDECAR_ITEM_DEFS: SidecarItemDef[] = [
  {
    id: 'FL_NOC',
    kind: 'form',
    state: 'FL',
    label: 'Florida Notice of Commencement',
    shortLabel: 'Notice of Commencement',
    slug: 'notice-of-commencement',
    blurb: 'Record this to start the project and lock in lien priority.',
  },
  {
    id: 'FL_NTO_SUB',
    kind: 'form',
    state: 'FL',
    label: 'Florida Notice to Owner (Subcontractor)',
    shortLabel: 'Subcontractor NTO',
    slug: 'notice-to-owner-sub',
    blurb: 'Preserves lien rights for subs and suppliers.',
  },
];

export function getSidecarItemById(id: string): SidecarItemDef | undefined {
  return SIDECAR_ITEM_DEFS.find((item) => item.id === id);
}

export function sidecarItemsForState(state?: string): SidecarItemDef[] {
  if (!state) return [];
  const s = state.toUpperCase();
  return SIDECAR_ITEM_DEFS.filter(
    (item) => item.state && item.state.toUpperCase() === s,
  );
}
