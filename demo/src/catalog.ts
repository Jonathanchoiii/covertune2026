import type { LiveOpenRelease } from "./openCatalog";
import {
  GENERATED_VISUAL_CANDIDATES,
  GENERATED_VISUAL_CANDIDATE_COUNT,
} from "./visualCatalog.generated";

export type MatchKind = "demo-art" | "visual-release" | "open-release";

export type OpenRelease = {
  letter: string;
  identifier: string;
  title: string;
  artist: string;
  licenseUrl: string;
};

export type AlbumMatch = {
  id: string;
  letter: string;
  title: string;
  artist: string;
  coverUrl: string;
  explanation: string;
  kind: MatchKind;
  detailUrl?: string;
  licenseUrl?: string;
};

const OPEN_RELEASES: OpenRelease[] = [
  {
    letter: "A",
    identifier: "aetech009saschaMller-theForcesOfMetaplex",
    title: "The Forces of Metaplex",
    artist: "Sascha Müller",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "B",
    identifier: "herbalspiritbojo",
    title: "bojo",
    artist: "Gothic Chipmunk",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/2.5/",
  },
  {
    letter: "C",
    identifier: "csm019MikeyFingersinertia",
    title: "Inertia",
    artist: "Mikey Fingers",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "D",
    identifier: "dead-dont-have-no-mercy",
    title: "Dead Don't Have No Mercy",
    artist: "Dead By Hanging",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  {
    letter: "E",
    identifier: "enrshow020_enough_records_radio_show__020",
    title: "Enough Records Radio Show #020",
    artist: "ps",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  {
    letter: "F",
    identifier: "floppycore-30-05-26",
    title: "Floppycore!",
    artist: "Various Artists",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  {
    letter: "G",
    identifier: "gt412FracturedPersona-PenetratedThereAndRot",
    title: "Penetrated There and Rot",
    artist: "Fractured Persona",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    letter: "H",
    identifier: "H.p.SneakstepAmericasActionHero",
    title: "America's Action Hero",
    artist: "H.P. Sneakstep",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  },
  {
    letter: "I",
    identifier: "headphonica.hplive002",
    title: "Improvised Bedroom Stories",
    artist: "New Earth Objects",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  },
  {
    letter: "J",
    identifier: "CTR004",
    title: "Jug Jug to Dirt Years",
    artist: "Dance Danse Revulsion",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "K",
    identifier: "enrmp067_k_m_krebs_and_mystified_-_reclaiming_the_darkness",
    title: "Reclaiming the Darkness",
    artist: "K.M. Krebs and Mystified",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  {
    letter: "L",
    identifier: "Cyberdread__Live_at_Macario_Cafe_09_10_05",
    title: "Live at Macario Café",
    artist: "Cyberdread",
    licenseUrl: "https://creativecommons.org/licenses/by-nc/3.0/",
  },
  {
    letter: "M",
    identifier: "MLD_028_Marino69_-_Intergalactic_ep",
    title: "Intergalactic EP",
    artist: "Marino69",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "N",
    identifier: "Nwtwo0098-sundrdisko-pentatonicAudioDeviceAndAuxilaryOutputs",
    title: "Pentatonic Audio Device",
    artist: "Šundrdisko",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "O",
    identifier: "lars_leonhard_infected",
    title: "Once Upon a Time",
    artist: "deepindub netlabel",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "P",
    identifier: "CousinSilas-PrisonerOfTheCoralDeep",
    title: "Prisoner of the Coral Deep",
    artist: "Cousin Silas",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  {
    letter: "Q",
    identifier: "gv489",
    title: "Dust",
    artist: "Quanthe",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "R",
    identifier: "waag_sng005",
    title: "Knurled Fog",
    artist: "Red Pools",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "S",
    identifier: "CWK_0003",
    title: "Survey",
    artist: "CWK",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "T",
    identifier: "tupperwear_at_gabinete",
    title: "tupperwear_at_gabinete",
    artist: "tupperwear",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/2.5/",
  },
  {
    letter: "U",
    identifier: "enrmp278_-_united_consumer_fuckers___prepare_for_revolution",
    title: "Prepare for Revolution",
    artist: "United Consumer Fuckers",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  },
  {
    letter: "V",
    identifier: "ComplexSilence33",
    title: "Complex Silence 33",
    artist: "Various Artists",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
  {
    letter: "W",
    identifier: "world-in-decline",
    title: "World in Decline",
    artist: "Dead By Hanging",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  {
    letter: "X",
    identifier: "CDGelements020",
    title: "XX",
    artist: "Kontoh & Lucas Darklord",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  },
  {
    letter: "Y",
    identifier: "yesno067",
    title: "Prasasti",
    artist: "Zoo",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  },
  {
    letter: "Z",
    identifier: "ZH27116",
    title: "Retro Preppie Bump Magnetism",
    artist: "Zan Hoffman",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
  },
];

const DEMO_MATCHES: Record<string, AlbumMatch> = {
  J: {
    id: "demo-j",
    letter: "J",
    title: "Downward Curve",
    artist: "Iris Vale",
    coverUrl: "/covers/demo-j.png",
    explanation: "弯曲的混凝土长廊形成了一个清晰的 J。",
    kind: "demo-art",
  },
  O: {
    id: "demo-o",
    letter: "O",
    title: "Orbital Glow",
    artist: "Aurelian Skies",
    coverUrl: "/covers/demo-o.png",
    explanation: "封面中央的日蚀光环像一个完整的 O。",
    kind: "demo-art",
  },
  N: {
    id: "demo-n",
    letter: "N",
    title: "Northbound",
    artist: "Milo Harrow",
    coverUrl: "/covers/demo-n.png",
    explanation: "两块竖向建筑与斜桥共同构成 N 的轮廓。",
    kind: "demo-art",
  },
};

/**
 * Real releases whose cover artwork was visually reviewed for the letter.
 * These are intentionally independent from title-initial matching.
 * Cover images are stored locally for this non-commercial prototype only.
 */
const CURATED_VISUAL_MATCHES: Record<string, AlbumMatch[]> = {
  C: [{
    id: "visual-c-cro",
    letter: "C",
    title: "C",
    artist: "CRO",
    coverUrl: "/covers/visual/c-cro.jpg",
    explanation: "星空中央的高亮弧形本身就是一个清晰的小写 c。",
    kind: "visual-release",
    detailUrl:
      "https://www.universalmusic.it/popular-music/album/c_34184225196/",
  }],
  H: [{
    id: "visual-h-ayumi",
    letter: "H",
    title: "H",
    artist: "Ayumi Hamasaki",
    coverUrl: "/covers/visual/h-ayumi.jpg",
    explanation: "封面右上角的蓝色符号由两条竖线与中间连接组成 H。",
    kind: "visual-release",
    detailUrl:
      "https://musicbrainz.org/release/2c4d7ec0-20fd-4ed3-8323-69646e69385c",
  }],
  L: [{
    id: "visual-l-kinki-kids",
    letter: "L",
    title: "L album",
    artist: "KinKi Kids",
    coverUrl: "/covers/visual/l-kinki-kids.jpg",
    explanation: "画面中央的黄色直线在底部转折，明确画出一个 L。",
    kind: "visual-release",
    detailUrl: "https://starto.jp/s/p/discography/JECN-333_5?artist=8",
  }],
  O: [{
    id: "visual-o-de-staat",
    letter: "O",
    title: "O",
    artist: "De Staat",
    coverUrl: "/covers/visual/o-de-staat.jpg",
    explanation: "蓝色封面中央的大号白色圆环直接构成 O。",
    kind: "visual-release",
    detailUrl:
      "https://musicbrainz.org/release/2a22f05a-9a34-4cf9-846b-18e435ec5818",
  }],
  E: [{
    id: "visual-e-ecco2k",
    letter: "E",
    title: "E",
    artist: "Ecco2k",
    coverUrl: "/covers/visual/e-ecco2k.jpg",
    explanation: "黑色估量标志的轮廓就是一个几何化的小写 e。",
    kind: "visual-release",
    detailUrl:
      "https://musicbrainz.org/release/f02a6c7c-ada5-4383-9c9c-417024693288",
  }],
};

const HINTS: Record<string, string> = {
  A: "尖角与横向结构让人联想到 A。",
  B: "重复的圆弧轮廓像 B 的上下两部分。",
  C: "开放的环形构图形成 C 的视觉线索。",
  D: "直边与外侧圆弧共同接近 D。",
  E: "平行横线与竖向结构接近 E。",
  F: "竖向主轴与两段横线形成 F 的节奏。",
  G: "未闭合圆环与内侧短线接近 G。",
  H: "两条竖向结构被中部横线连接。",
  I: "单一的竖向焦点形成 I 的轮廓。",
  J: "弯钩或下落曲线提供了 J 的视觉线索。",
  K: "一条主轴与两条斜线形成 K 的张力。",
  L: "竖线与底部横线构成 L。",
  M: "多段折线形成类似 M 的山形结构。",
  N: "两条主轴与对角线形成 N。",
  O: "圆形或环形主体自然对应 O。",
  P: "竖向主体与上部圆弧接近 P。",
  Q: "圆环加一段斜向尾巴让人联想到 Q。",
  R: "上部圆弧与斜向支脚形成 R。",
  S: "连续的反向曲线形成 S 的节奏。",
  T: "顶部横线与中央竖线构成 T。",
  U: "两侧竖线在底部以圆弧连接。",
  V: "两条斜线向下汇聚形成 V。",
  W: "连续的折线形成 W 的轮廓。",
  X: "两条对角线交叉形成 X。",
  Y: "上部分叉、下部汇聚成 Y。",
  Z: "上下横线与对角线形成 Z。",
};

export function normalizeName(value: string) {
  const trimmed = value.trim();
  const validSeparatorsRemoved = trimmed.replace(/[ '\-]/g, "");

  if (!validSeparatorsRemoved) {
    return { normalized: "", error: "先输入一个英文名字吧" };
  }

  if (!/^[A-Za-z]+$/.test(validSeparatorsRemoved)) {
    return {
      normalized: "",
      error: "目前只支持英文字母；空格、连字符和英文撇号会自动忽略",
    };
  }

  const normalized = validSeparatorsRemoved.toUpperCase();
  if (normalized.length > 10) {
    return { normalized: "", error: "最多输入 10 个字母" };
  }

  return { normalized, error: "" };
}

function toOpenMatch(release: OpenRelease, occurrence: number): AlbumMatch {
  const archiveCover = `archive.org/services/img/${release.identifier}`;
  return {
    id: `${release.identifier}-${occurrence}`,
    letter: release.letter,
    title: release.title,
    artist: release.artist,
    coverUrl: `https://wsrv.nl/?url=${encodeURIComponent(archiveCover)}&output=jpg`,
    explanation: `${HINTS[release.letter]} 这是开放档案候选，仍需人工视觉审核。`,
    kind: "open-release",
    detailUrl: `https://archive.org/details/${encodeURIComponent(release.identifier)}`,
    licenseUrl: release.licenseUrl,
  };
}

function toLiveOpenMatch(
  release: LiveOpenRelease,
  letter: string,
  occurrence: number,
): AlbumMatch {
  return {
    id: `${release.identifier}-live-${occurrence}`,
    letter,
    title: release.title,
    artist: release.artist,
    coverUrl: release.coverUrl,
    explanation: `${HINTS[letter]} 这是刚从开放音乐目录读取的候选，仍需人工视觉审核。`,
    kind: "open-release",
    detailUrl: release.detailUrl,
    licenseUrl: release.licenseUrl,
  };
}

function visualPoolFor(letter: string): AlbumMatch[] {
  const curated = CURATED_VISUAL_MATCHES[letter] ?? [];
  const generated = (GENERATED_VISUAL_CANDIDATES[letter] ?? []).map(
    (candidate): AlbumMatch => ({
      id: `visual-${candidate.releaseId}`,
      letter,
      title: candidate.title,
      artist: candidate.artist,
      coverUrl: candidate.localCoverUrl,
      explanation: `${HINTS[letter]} 这张真实发行封面已通过原型视觉预筛，作为 ${letter} 的候选。`,
      kind: "visual-release",
      detailUrl: candidate.detailUrl,
    }),
  );

  return [...curated, ...generated];
}

export function buildMatches(
  name: string,
  seed: number,
  liveCandidates: LiveOpenRelease[] = [],
): AlbumMatch[] {
  const occurrences = new Map<string, number>();

  return name.split("").map((letter) => {
    const occurrence = occurrences.get(letter) ?? 0;
    occurrences.set(letter, occurrence + 1);

    const useDemoArt =
      name === "JON" &&
      seed % 2 === 0 &&
      occurrence === 0 &&
      DEMO_MATCHES[letter];

    if (useDemoArt) {
      return { ...DEMO_MATCHES[letter], id: `${DEMO_MATCHES[letter].id}-${seed}` };
    }

    const visualPool = visualPoolFor(letter);
    const visualRelease =
      visualPool.length > 0
        ? visualPool[(seed * 17 + occurrence) % visualPool.length]
        : undefined;
    if (visualRelease) {
      return {
        ...visualRelease,
        id: `${visualRelease.id}-${seed}-${occurrence}`,
      };
    }

    const liveForLetter = liveCandidates.filter(
      (candidate) => candidate.letter === letter,
    );
    const liveRelease =
      liveForLetter.length > 0
        ? liveForLetter[(seed + occurrence) % liveForLetter.length]
        : undefined;
    if (liveRelease) {
      return toLiveOpenMatch(liveRelease, letter, occurrence);
    }

    const release = OPEN_RELEASES.find((item) => item.letter === letter);
    if (!release) {
      throw new Error(`No open release for letter ${letter}`);
    }

    return toOpenMatch(release, occurrence);
  });
}

export function layoutForCount(count: number) {
  if (count === 1) return "single";
  if (count <= 3) return "constellation";
  if (count <= 6) return "gallery";
  return "index";
}

export const OPEN_CATALOG_COUNT = OPEN_RELEASES.length;
export const VISUAL_LETTER_COUNT = 26;
export const VISUAL_CATALOG_COUNT =
  GENERATED_VISUAL_CANDIDATE_COUNT +
  Object.values(CURATED_VISUAL_MATCHES).reduce(
    (total, candidates) => total + candidates.length,
    0,
  );
