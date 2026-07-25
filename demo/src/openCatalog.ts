type ArchiveDoc = {
  identifier?: string;
  title?: string;
  creator?: string | string[];
  licenseurl?: string;
};

type ArchiveResponse = {
  response?: {
    docs?: ArchiveDoc[];
  };
};

export type LiveOpenRelease = {
  letter: string;
  identifier: string;
  title: string;
  artist: string;
  coverUrl: string;
  detailUrl: string;
  licenseUrl: string;
};

/**
 * Optional live adapter for Internet Archive's Advanced Search API.
 *
 * The interactive demo uses a reviewed static snapshot so every letter works
 * offline. This function is intentionally kept small and side-effect free so a
 * production ingestion job can refresh that snapshot without changing the UI.
 */
export async function fetchOpenNetlabelCandidates(
  letters: string[],
  signal?: AbortSignal,
): Promise<LiveOpenRelease[]> {
  const initials = [...new Set(letters)].filter((letter) =>
    /^[A-Z]$/.test(letter),
  );

  if (initials.length === 0) return [];

  const resultSets = await Promise.all(
    initials.map(async (letter) => {
      const query = [
        "collection:netlabels",
        "mediatype:audio",
        "licenseurl:*",
        `title:${letter.toLowerCase()}*`,
      ].join(" AND ");
      const params = new URLSearchParams({
        q: query,
        rows: "8",
        page: "1",
        output: "json",
      });
      ["identifier", "title", "creator", "licenseurl"].forEach((field) =>
        params.append("fl[]", field),
      );

      const response = await fetch(
        `https://archive.org/advancedsearch.php?${params.toString()}`,
        { signal },
      );
      if (!response.ok) {
        throw new Error(`Internet Archive returned ${response.status}`);
      }

      const payload = (await response.json()) as ArchiveResponse;
      return (payload.response?.docs ?? [])
        .filter(
          (
            doc,
          ): doc is Required<
            Pick<ArchiveDoc, "identifier" | "title" | "licenseurl">
          > &
            ArchiveDoc =>
            Boolean(doc.identifier && doc.title && doc.licenseurl),
        )
        .map((doc) => {
          const archiveCover = `archive.org/services/img/${doc.identifier}`;
          return {
            letter,
            identifier: doc.identifier,
            title: doc.title,
            artist: Array.isArray(doc.creator)
              ? doc.creator.join(", ")
              : doc.creator || "Unknown artist",
            coverUrl: `https://wsrv.nl/?url=${encodeURIComponent(archiveCover)}&output=jpg`,
            detailUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
            licenseUrl: doc.licenseurl,
          };
        });
    }),
  );

  return resultSets.flat();
}
