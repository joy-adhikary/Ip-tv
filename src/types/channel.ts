export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  country: string;
  tvgId?: string;
  tvgName?: string;
}

export type CountryCode = 'bd' | 'in' | 'ar' | 'all';

export type SidebarView =
  | 'all'
  | 'sports'
  | 'bd'
  | 'in'
  | 'ar'
  | 'favorites';
