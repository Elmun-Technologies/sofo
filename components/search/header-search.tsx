"use client";

import { SearchCombobox } from "./search-combobox";

/** Header search box with instant results. "/" focuses it from anywhere; Enter opens the results page. */
export function HeaderSearch({ action }: { action: string }) {
  return <SearchCombobox action={action} variant="header" />;
}
