import { useEffect, useMemo, useState } from "react";
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CaretDown,
  Check,
  Copy,
  GearSix,
  LinkSimpleHorizontal,
  MagnifyingGlass,
  MusicNotes,
  Record,
  SlidersHorizontal,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  SiApplemusic,
  SiMusicbrainz,
  SiSpotify,
  SiYoutube,
} from "react-icons/si";

const defaultCandidate = {
  id: "b1392450-e666-3926-a536-22c65f834433",
  title: "OK Computer",
  artist: "Radiohead",
  artists: ["Radiohead"],
  year: "1997",
  type: "Album",
  secondaryTypes: [],
  searchScore: 100,
  note: "MusicBrainz 标准发行组",
  sourceUrl:
    "https://musicbrainz.org/release-group/b1392450-e666-3926-a536-22c65f834433",
  coverUrl:
    "https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-500",
};

function toCandidate(item) {
  const artist = item.artists?.join(" & ") || "未知歌手";
  const year = item.firstReleaseDate?.slice(0, 4) || "年份未知";
  const type = item.secondaryTypes?.[0] || item.primaryType || "Other";

  return {
    ...item,
    artist,
    year,
    type,
    note: `MusicBrainz 搜索分 ${item.searchScore}`,
  };
}

const providerConfig = [
  {
    id: "musicbrainz",
    name: "MusicBrainz",
    icon: SiMusicbrainz,
    iconClass: "brand-musicbrainz",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: SiSpotify,
    iconClass: "brand-spotify",
  },
  {
    id: "apple",
    name: "Apple Music",
    icon: SiApplemusic,
    iconClass: "brand-apple",
  },
  {
    id: "douban",
    name: "豆瓣音乐",
    icon: MusicNotes,
    iconClass: "brand-douban",
  },
  {
    id: "youtube",
    name: "YouTube Music",
    icon: SiYoutube,
    iconClass: "brand-youtube",
  },
  {
    id: "aoty",
    name: "AOTY",
    icon: Record,
    iconClass: "brand-aoty",
  },
  {
    id: "recordclub",
    name: "Record Club",
    icon: Record,
    iconClass: "brand-recordclub",
  },
];

const statusLabels = {
  verified_exact: "已验证",
  probable: "高置信",
  needs_review: "建议复核",
  not_found: "未找到",
  not_configured: "未配置",
  temporarily_unavailable: "暂时不可用",
};

function buildProviderRows(candidate, resolution, isResolving, resolutionError) {
  if (!candidate) return [];

  return providerConfig.map((config) => {
    const result = resolution?.providers?.[config.id];

    if (!result) {
      return {
        ...config,
        title: candidate.title,
        artist: candidate.artist,
        year: candidate.year,
        coverUrl: candidate.coverUrl,
        score: null,
        confidence: isResolving ? "解析中" : "暂时不可用",
        coverage: null,
        evidence: [
          resolutionError ||
            (isResolving ? "正在解析具体发行与平台实体" : "尚未解析详情"),
        ],
        detail: "—",
        button: "不可用",
        url: "",
        exact: false,
        unavailable: true,
        unavailableLabel: isResolving ? "解析中" : "不可用",
      };
    }

    const exact =
      Boolean(result.detailUrl) &&
      ["verified_exact", "probable", "needs_review"].includes(result.status);
    const trackCount = result.trackCount || result.tracks?.length || 0;

    return {
      ...config,
      title: result.title || candidate.title,
      artist: result.artist || candidate.artist,
      year: result.releaseDate?.slice(0, 4) || candidate.year,
      coverUrl: result.coverUrl || candidate.coverUrl,
      score: result.matchScore,
      confidence: statusLabels[result.status] || result.status,
      coverage:
        typeof result.evidenceCoverage === "number"
          ? `证据覆盖 ${Math.round(result.evidenceCoverage * 100)}%`
          : null,
      evidence: result.evidence || [],
      detail: exact
        ? trackCount
          ? `详情页 · ${trackCount} 曲`
          : "专辑详情页"
        : "—",
      button: exact ? "打开" : "不可用",
      url: result.detailUrl || "",
      exact,
      unavailable: !exact,
      unavailableLabel: statusLabels[result.status] || "不可用",
      warning:
        result.status === "probable" || result.status === "needs_review"
          ? "请复核具体版本"
          : null,
      tracks: result.tracks || [],
      provenance: result.provenance,
    };
  });
}

const resolutionRequests = new Map();

async function loadAlbumResolution(params) {
  const key = params.toString();
  if (resolutionRequests.has(key)) return resolutionRequests.get(key);

  const request = fetch(`/api/albums/resolve?${key}`).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || "专辑详情解析失败");
    }
    return payload;
  });

  resolutionRequests.set(key, request);
  request.catch(() => resolutionRequests.delete(key));
  return request;
}

function ProviderLogo({ row }) {
  const Icon = row.icon;
  return (
    <span className={`provider-logo ${row.iconClass}`} aria-hidden="true">
      <Icon weight="fill" />
    </span>
  );
}

function CoverImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        className={`${className} cover-fallback`}
        role="img"
        aria-label={alt || "暂无专辑封面"}
      >
        <Record weight="duotone" />
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function formatDuration(lengthMs) {
  if (!lengthMs) return "";
  const totalSeconds = Math.round(lengthMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function ProviderRow({ row, openEvidence, setOpenEvidence, onCopy }) {
  const isExpanded = openEvidence === row.id;

  return (
    <article className={`provider-row ${isExpanded ? "is-expanded" : ""}`}>
      <div className="provider-main">
        <div className="provider-cell provider-name">
          <ProviderLogo row={row} />
          <span>{row.name}</span>
        </div>

        <div className="provider-cell match-record">
          <CoverImage
            src={row.coverUrl}
            alt={`${row.artist}《${row.title}》封面`}
          />
          <div>
            <strong>{row.title}</strong>
            <span>{row.artist}</span>
            <span>{row.year}</span>
          </div>
        </div>

        <div className="provider-cell score-cell">
          {row.score === null ? (
            <span className="score-dash">—</span>
          ) : (
            <strong className="score-number">{row.score}</strong>
          )}
          <span>{row.confidence}</span>
          {row.coverage && <small>{row.coverage}</small>}
        </div>

        <div className="provider-cell evidence-cell">
          {row.evidence.length > 0 ? (
            <>
              <span>{row.evidence.slice(0, 3).join(" · ")}</span>
              {row.evidence[3] && <span>{row.evidence.slice(3).join(" · ")}</span>}
              {row.warning && (
                <span className="warning-line">
                  <WarningCircle weight="fill" />
                  {row.warning}
                </span>
              )}
              <button
                className="text-action"
                onClick={() => setOpenEvidence(isExpanded ? null : row.id)}
                aria-expanded={isExpanded}
              >
                查看证据
              </button>
            </>
          ) : (
            <span className="muted">—</span>
          )}
        </div>

        <div className="provider-cell link-type">{row.detail}</div>

        <div className="provider-cell row-actions">
          {row.unavailable ? (
            <button className="compact-button" disabled>
              <span className="availability-dot" />
              {row.unavailableLabel || "不可用"}
            </button>
          ) : (
            <>
              <a
                className="compact-button"
                href={row.url}
                target="_blank"
                rel="noreferrer"
              >
                {row.button === "搜索" ? <MagnifyingGlass /> : <LinkSimpleHorizontal />}
                {row.button}
              </a>
              <button
                className="icon-button compact-menu"
                onClick={() => onCopy(row.url, `${row.name} 链接`)}
                aria-label={`复制 ${row.name} 链接`}
                title={`复制 ${row.name} 链接`}
              >
                <Copy />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="evidence-panel">
          <div>
            <span>匹配依据</span>
            <strong>{row.evidence.join(" / ")}</strong>
          </div>
          <div>
            <span>链接类型</span>
            <strong>{row.exact ? "精确专辑详情页" : "无已验证详情页"}</strong>
          </div>
          <div>
            <span>当前建议</span>
            <strong>
              {row.exact
                ? row.score && row.score >= 85
                  ? "可复制详情页给 NeoDB 继续检索"
                  : "打开详情页后复核具体版本"
                : "等待配置官方接口或发现官方关联"}
            </strong>
          </div>
          {row.tracks?.length > 0 && (
            <div className="track-preview">
              <span>曲目预览 · 共 {row.tracks.length} 首</span>
              <ol>
                {row.tracks.slice(0, 8).map((track, index) => (
                  <li key={`${track.disc}-${track.position}-${track.title}-${index}`}>
                    <span>{track.position || index + 1}</span>
                    <strong>{track.title}</strong>
                    <small>{formatDuration(track.lengthMs)}</small>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function App() {
  const [artist, setArtist] = useState("Radiohead");
  const [album, setAlbum] = useState("OK Computer");
  const [year, setYear] = useState("1997");
  const [candidateAlbums, setCandidateAlbums] = useState([defaultCandidate]);
  const [candidateTotal, setCandidateTotal] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(defaultCandidate);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openEvidence, setOpenEvidence] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState(null);
  const [resolutionError, setResolutionError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [toast, setToast] = useState("");
  const [neoDbBase, setNeoDbBase] = useState("https://neodb.social");
  const [market, setMarket] = useState("CN");
  const [historyEnabled, setHistoryEnabled] = useState(true);

  const providerRows = useMemo(
    () =>
      buildProviderRows(
        selectedCandidate,
        resolution,
        isResolving,
        resolutionError,
      ),
    [selectedCandidate, resolution, isResolving, resolutionError],
  );
  const recommended = providerRows.find((row) => row.exact);

  useEffect(() => {
    if (!selectedCandidate) {
      setResolution(null);
      setResolutionError("");
      return undefined;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      releaseGroupId: selectedCandidate.id,
      title: selectedCandidate.title,
      artist: selectedCandidate.artist,
      year: selectedCandidate.year === "年份未知" ? "" : selectedCandidate.year,
      market,
    });

    setIsResolving(true);
    setResolution(null);
    setResolutionError("");
    setOpenEvidence(null);

    loadAlbumResolution(params)
      .then((payload) => {
        if (!cancelled) setResolution(payload);
      })
      .catch((error) => {
        if (!cancelled) {
          setResolutionError(error.message || "专辑详情解析失败");
        }
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCandidate, market]);

  const copyText = async (text, label) => {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      textarea.remove();
    }

    if (copied) {
      setToast(`已复制${label ? ` ${label}` : ""}`);
    } else {
      setToast("复制失败，请手动选择链接");
    }
    window.setTimeout(() => setToast(""), 2200);
  };

  const copyAll = () => {
    const text = providerRows
      .filter((row) => row.url && (row.exact || row.score >= 70))
      .map((row) => `${row.name}: ${row.url}`)
      .join("\n");
    copyText(text, "全部可用链接");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!artist.trim() && !album.trim()) {
      setToast("歌手名和专辑名至少填写一个");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setOpenEvidence(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams({
        artist: artist.trim(),
        album: album.trim(),
        limit: "50",
      });
      const response = await fetch(`/api/musicbrainz/search?${params.toString()}`, {
        signal: controller.signal,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message || "MusicBrainz 查询失败");
      }

      const candidates = payload.candidates.map(toCandidate);
      setCandidateAlbums(candidates);
      setCandidateTotal(payload.count);
      setSelectedCandidate(candidates[0] || null);

      if (candidates.length === 0) {
        setSearchError("MusicBrainz 没有找到候选，请检查拼写或减少限定条件。");
        setToast("没有找到匹配专辑");
      } else {
        setToast(
          `已从 MusicBrainz 找到 ${payload.count} 个结果，显示前 ${candidates.length} 个`,
        );
      }
    } catch (error) {
      const message =
        error.name === "AbortError"
          ? "MusicBrainz 查询超时，请稍后重试。"
          : error.message || "联网查询失败，请稍后重试。";
      setSearchError(message);
      setToast(message);
    } finally {
      window.clearTimeout(timeout);
      setIsSearching(false);
      window.setTimeout(() => setToast(""), 2200);
    }
  };

  const currentTitle = useMemo(
    () =>
      selectedCandidate
        ? `${selectedCandidate.title} — ${selectedCandidate.artist}`
        : "暂无标准专辑",
    [selectedCandidate],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="wordmark">
            Album<span>Linker</span>
          </span>
          <span className="brand-divider" />
          <span className="descriptor">专辑跨平台匹配与 NeoDB 链接助手</span>
        </div>
        <div className="header-actions">
          <span className="demo-label">精确详情解析 · 搜索结果页已禁用</span>
          <button className="settings-button" onClick={() => setSettingsOpen(true)}>
            <GearSix />
            设置
          </button>
        </div>
      </header>

      <form className="searchbar" onSubmit={handleSubmit}>
        <label>
          <span>歌手名</span>
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="输入歌手名"
          />
        </label>
        <label className="album-field">
          <span>专辑名</span>
          <input
            value={album}
            onChange={(event) => setAlbum(event.target.value)}
            placeholder="输入专辑名"
          />
        </label>
        <label className="year-field">
          <span>年份 <small>（可选）</small></span>
          <input
            value={year}
            onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="年份"
          />
        </label>
        <button className="primary-button search-button" disabled={isSearching}>
          {isSearching ? (
            <>
              <ArrowsClockwise className="spin" />
              匹配中
            </>
          ) : (
            <>
              <MagnifyingGlass />
              搜索专辑
            </>
          )}
        </button>
      </form>

      <main className="workspace">
        <aside className="album-summary">
          <CoverImage
            className="hero-cover"
            src={selectedCandidate?.coverUrl}
            alt={`${currentTitle} 专辑封面`}
          />
          {selectedCandidate ? (
            <>
              <div className="album-copy">
                <h1>{selectedCandidate.title}</h1>
                <h2>{selectedCandidate.artist}</h2>
                <span className="accent-rule" />
                <p>
                  {selectedCandidate.year} · {selectedCandidate.type}
                </p>
                <small>
                  {resolution?.canonicalRelease
                    ? `具体发行：${resolution.canonicalRelease.country || "地区未知"} · ${
                        resolution.canonicalRelease.trackCount || 0
                      } 曲`
                    : isResolving
                      ? "正在解析具体发行与曲目"
                      : "MusicBrainz Release Group"}
                </small>
              </div>
              <button
                className="secondary-button"
                onClick={() => setCandidateOpen(true)}
                disabled={candidateAlbums.length < 2}
              >
                <ArrowsClockwise />
                更换其他专辑
              </button>
            </>
          ) : (
            <div className="album-copy empty-album-copy">
              <h1>未找到标准专辑</h1>
              <h2>请修改搜索条件</h2>
              <span className="accent-rule" />
              <p>没有可用于跨平台比较的 MusicBrainz 实体</p>
            </div>
          )}
          <div className="candidate-count">
            {searchError ? <WarningCircle /> : <MagnifyingGlass />}
            <div>
              <strong>
                {searchError
                  ? "本次查询未完成"
                  : `找到 ${candidateTotal} 个候选结果`}
              </strong>
              <span>
                {searchError || "已选择最高搜索分结果，可手动更换"}
              </span>
            </div>
          </div>
        </aside>

        <section className="providers" aria-busy={isSearching || isResolving}>
          <div className="provider-header" aria-hidden="true">
            <span>平台</span>
            <span>匹配结果</span>
            <span>状态 / 置信度</span>
            <span>证据（关键字段）</span>
            <span>链接类型</span>
            <span>操作</span>
          </div>
          <div
            className={
              isSearching || isResolving
                ? "providers-list is-loading"
                : "providers-list"
            }
          >
            {providerRows.length > 0 ? (
              providerRows.map((row) => (
                <ProviderRow
                  key={row.id}
                  row={row}
                  openEvidence={openEvidence}
                  setOpenEvidence={setOpenEvidence}
                  onCopy={copyText}
                />
              ))
            ) : (
              <div className="providers-empty">
                <Record weight="duotone" />
                <strong>暂无可比较结果</strong>
                <span>修改歌手名或专辑名后重新搜索。</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="copy-dock">
        <div className="recommended-link">
          <span className="link-orb">
            <LinkSimpleHorizontal />
          </span>
          <div>
            <strong>
              {recommended
                ? `将复制 ${recommended.name} 链接`
                : "暂无可确认的 NeoDB 支持链接"}
            </strong>
            <span>{recommended?.url || "请先选择一个 MusicBrainz 标准专辑"}</span>
          </div>
          <button
            className="icon-button"
            onClick={() => recommended && copyText(recommended.url, "MusicBrainz 链接")}
            aria-label="复制推荐链接"
            disabled={!recommended}
          >
            <Copy />
          </button>
        </div>
        <div className="dock-actions">
          <a className="secondary-button large" href={neoDbBase} target="_blank" rel="noreferrer">
            <ArrowSquareOut />
            打开 NeoDB
          </a>
          <button
            className="secondary-button large"
            onClick={copyAll}
            disabled={!recommended}
          >
            <Copy />
            复制全部
          </button>
          <button
            className="primary-button neodb-button"
            onClick={() => recommended && copyText(recommended.url, "MusicBrainz 链接")}
            disabled={!recommended}
          >
            <Copy />
            复制给 NeoDB
          </button>
        </div>
      </footer>

      {candidateOpen && candidateAlbums.length > 0 && (
        <div className="overlay" role="presentation" onMouseDown={() => setCandidateOpen(false)}>
          <section
            className="candidate-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-header">
              <div>
                <span>标准专辑</span>
                <h3 id="candidate-title">选择其他专辑</h3>
                <p>当前 {candidateAlbums.length} 条候选，最多显示 50 条</p>
              </div>
              <button className="icon-button" onClick={() => setCandidateOpen(false)}>
                <X />
              </button>
            </div>
            <div className="candidate-list">
              {candidateAlbums.map((candidate) => (
                <button
                  key={candidate.id}
                  className={`candidate-option ${
                    selectedCandidate.id === candidate.id ? "is-selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedCandidate(candidate);
                    setCandidateOpen(false);
                    setToast(`已选择 ${candidate.title}`);
                    window.setTimeout(() => setToast(""), 2200);
                  }}
                >
                  <CoverImage
                    src={candidate.coverUrl}
                    alt={`${candidate.artist}《${candidate.title}》封面`}
                  />
                  <div>
                    <strong>{candidate.title}</strong>
                    <span>
                      {candidate.artist} · {candidate.year} · {candidate.type}
                    </span>
                    <small>{candidate.note}</small>
                  </div>
                  <span className="selection-mark">
                    {selectedCandidate.id === candidate.id && <Check weight="bold" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="overlay settings-overlay" onMouseDown={() => setSettingsOpen(false)}>
          <aside
            className="settings-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-header">
              <div>
                <span>偏好</span>
                <h3 id="settings-title">工具设置</h3>
              </div>
              <button className="icon-button" onClick={() => setSettingsOpen(false)}>
                <X />
              </button>
            </div>
            <label className="settings-field">
              <span>NeoDB 实例</span>
              <input value={neoDbBase} onChange={(event) => setNeoDbBase(event.target.value)} />
            </label>
            <label className="settings-field">
              <span>默认地区 / 商店</span>
              <select value={market} onChange={(event) => setMarket(event.target.value)}>
                <option value="CN">中国大陆 · CN</option>
                <option value="HK">中国香港 · HK</option>
                <option value="JP">日本 · JP</option>
                <option value="US">美国 · US</option>
              </select>
              <CaretDown className="select-caret" />
            </label>
            <button
              className={`toggle-row ${historyEnabled ? "is-on" : ""}`}
              onClick={() => setHistoryEnabled(!historyEnabled)}
            >
              <span>
                <strong>保存本地查询历史</strong>
                <small>只保存在当前浏览器</small>
              </span>
              <span className="toggle">
                <span />
              </span>
            </button>
            <div className="settings-note">
              <SlidersHorizontal />
              <span>
                只展示经过验证的专辑详情页；Spotify 需要服务端凭证，其他无公开接口的平台依赖 MusicBrainz 官方关联。
              </span>
            </div>
            <button className="primary-button save-settings" onClick={() => setSettingsOpen(false)}>
              保存设置
            </button>
          </aside>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Check weight="bold" />
          {toast}
        </div>
      )}
    </div>
  );
}
