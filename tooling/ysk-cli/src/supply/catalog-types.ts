export type SupplyCatalog = {
  updated: string;
  runtimes: {
    node: {
      lines: Record<string, { min: string }>;
      advisories: string[];
    };
    php: {
      lines: Record<string, { min: string }>;
      eolMax: string;
      advisories: string[];
    };
    linux: {
      advisories: { id: string; name: string; mitigations: string }[];
    };
  };
  packages: {
    npm: { name: string; bad: string[]; id: string; reason: string }[];
  };
};
