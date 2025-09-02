export interface ChangelogLink {
  label: string;
  href?: string | null;
  link?: string;
}

export interface ChangelogFeatures {
  ameliorations?: string[];
}

export interface ChangelogFix {
  bugs?: string[];
}

export interface ChangelogBlock {
  description?: string;
  features?: ChangelogFeatures;
  fix?: ChangelogFix;
  link?: ChangelogLink[];
}

export interface ChangelogContent {
  title: string;
  releaseDate: string;
  version?: string;
  blocks: ChangelogBlock[];
}

export interface Item {
  id: string;
  label: string;
  version?: string;
  content: ChangelogContent;
}
