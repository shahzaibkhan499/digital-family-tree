'use client';

import { createContext, useContext } from 'react';

export interface SidebarContextType {
  collapsed: boolean;
  toggleCollapse: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapse: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);
