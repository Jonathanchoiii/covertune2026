import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  InfoCircledIcon,
  Pencil2Icon,
  QuestionMarkCircledIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";
import {
  buildMatches,
  layoutForCount,
  normalizeName,
  OPEN_CATALOG_COUNT,
  VISUAL_CATALOG_COUNT,
  VISUAL_LETTER_COUNT,
  type AlbumMatch,
} from "./catalog";
import {
  fetchOpenNetlabelCandidates,
  type LiveOpenRelease,
} from "./openCatalog";
import "./prototype.css";

function readInitialState() {
  const params = new URLSearchParams(window.location.search);
  const rawName = params.get("name") || "MARTIN";
  const parsedSeed = Number.parseInt(params.get("seed") || "0", 10);
  const { normalized } = normalizeName(rawName);

  return {
    rawName,
    submittedName: normalized || "MARTIN",
    seed: Number.isFinite(parsedSeed) ? Math.max(0, parsedSeed) : 0,
  };
}

function sourceLabel(
  matches: AlbumMatch[],
  loading: boolean,
  liveCandidateCount: number,
) {
  const visualCount = matches.filter(
    (match) => match.kind === "visual-release",
  ).length;
  if (visualCount === matches.length) {
    return `视觉预筛 ${visualCount}/${matches.length} · 封面形状匹配`;
  }
  if (visualCount > 0) {
    return `视觉预筛 ${visualCount}/${matches.length} · 其余开放候选`;
  }
  if (loading) return "正在读取开放封面…";
  if (liveCandidateCount > 0) {
    return `Internet Archive · ${liveCandidateCount} 个实时候选`;
  }
  const hasDemo = matches.some((match) => match.kind === "demo-art");
  return hasDemo ? "演示视觉 · 开放目录已就绪" : "Internet Archive · CC 开放条目";
}

function loadCanvasImage(src: string, crossOrigin = false) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });
}

export default function Prototype() {
  const initial = useMemo(readInitialState, []);
  const keyboard = useKeyboard();
  const [rawName, setRawName] = useState(initial.rawName);
  const [submittedName, setSubmittedName] = useState(initial.submittedName);
  const [seed, setSeed] = useState(initial.seed);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AlbumMatch | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [toast, setToast] = useState("");
  const [liveCandidates, setLiveCandidates] = useState<LiveOpenRelease[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const nameAlignmentFrame = useRef<number | null>(null);

  const matches = useMemo(
    () => buildMatches(submittedName, seed, liveCandidates),
    [liveCandidates, seed, submittedName],
  );
  const layout = layoutForCount(matches.length);
  const inputCount = rawName.replace(/[ '\-]/g, "").length;

  const alignNameInputAboveKeyboard = useCallback(
    (input: HTMLInputElement) => {
      if (nameAlignmentFrame.current !== null) {
        window.cancelAnimationFrame(nameAlignmentFrame.current);
      }

      const scroll = input
        .closest(".mobile-page")
        ?.querySelector<HTMLElement>(".mobile-scroll");
      const dock = input.closest<HTMLElement>(".command-dock");
      if (!scroll || !dock) return;

      const startedAt = performance.now();
      const align = () => {
        if (document.activeElement !== input) {
          nameAlignmentFrame.current = null;
          return;
        }

        const scrollRect = scroll.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        const desiredDockBottom = scrollRect.bottom - 14;
        const delta = dockRect.bottom - desiredDockBottom;

        if (Math.abs(delta) > 1) {
          const maxScrollTop = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
          scroll.scrollTop = Math.min(
            maxScrollTop,
            Math.max(0, scroll.scrollTop + delta),
          );
        }

        if (performance.now() - startedAt < 420) {
          nameAlignmentFrame.current = window.requestAnimationFrame(align);
        } else {
          nameAlignmentFrame.current = null;
        }
      };

      nameAlignmentFrame.current = window.requestAnimationFrame(align);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (nameAlignmentFrame.current !== null) {
        window.cancelAnimationFrame(nameAlignmentFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = normalizeName(rawName);
      if (result.error) {
        setError(rawName.trim() ? result.error : "");
        return;
      }

      setError("");
      if (result.normalized === submittedName) return;

      setSubmittedName(result.normalized);
      setSeed(0);
      const params = new URLSearchParams({
        name: result.normalized,
        seed: "0",
      });
      window.history.replaceState({}, "", `?${params.toString()}`);
      window.requestAnimationFrame(() => {
        const activeInput = document.getElementById("cover-name");
        if (
          activeInput instanceof HTMLInputElement &&
          document.activeElement === activeInput
        ) {
          alignNameInputAboveKeyboard(activeInput);
          return;
        }

        document
          .querySelectorAll<HTMLElement>(".device-screen, .mobile-scroll")
          .forEach((element) => {
            element.scrollTop = 0;
          });
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [alignNameInputAboveKeyboard, rawName, submittedName]);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);

    fetchOpenNetlabelCandidates(submittedName.split(""), controller.signal)
      .then((candidates) => {
        setLiveCandidates(candidates);
        setCatalogLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setLiveCandidates([]);
        setCatalogLoading(false);
      });

    return () => controller.abort();
  }, [submittedName]);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const syncUrl = (name: string, nextSeed: number) => {
    const params = new URLSearchParams({ name, seed: String(nextSeed) });
    window.history.replaceState({}, "", `?${params.toString()}`);
  };

  const dismissKeyboard = () => {
    document.getElementById("cover-name")?.blur();
    keyboard.hide();
  };

  const resetResultScroll = () => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>(".device-screen, .mobile-scroll").forEach(
          (element) => {
            element.scrollTop = 0;
          },
        );
      }, 280);
    });
  };

  const submitName = () => {
    const result = normalizeName(rawName);
    if (result.error) {
      setError(result.error);
      return;
    }

    dismissKeyboard();
    window.setTimeout(dismissKeyboard, 0);
    setError("");
    setSubmittedName(result.normalized);
    setRawName(result.normalized);
    setSeed(0);
    syncUrl(result.normalized, 0);
    resetResultScroll();
  };

  const shuffle = () => {
    const liveValue =
      (document.getElementById("cover-name") as HTMLInputElement | null)?.value ??
      rawName;
    const result = normalizeName(liveValue);
    if (result.error) {
      setError(result.error);
      return;
    }

    dismissKeyboard();
    window.setTimeout(dismissKeyboard, 0);
    const nextSeed =
      result.normalized === submittedName ? seed + 1 : 0;
    setError("");
    setSubmittedName(result.normalized);
    setRawName(result.normalized);
    setSeed(nextSeed);
    syncUrl(result.normalized, nextSeed);
    resetResultScroll();
    notify("已从字母候选池换了一组");
  };

  const savePoster = async () => {
    try {
      const canvas = document.createElement("canvas");
      const columns = Math.min(matches.length, 5);
      const rows = Math.ceil(matches.length / columns);
      canvas.width = 1400;
      canvas.height = 500 + rows * 248;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");

      context.fillStyle = "#f0f0ed";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#151515";
      context.font = "700 70px Arial, sans-serif";
      context.fillText("CoverTune", 90, 110);
      context.font = "700 54px Arial, sans-serif";
      context.fillText(`${submittedName}，这是你的封面歌单`, 90, 205);
      context.font = "28px Arial, sans-serif";
      context.fillStyle = "#6c6c68";
      context.fillText("每张封面，刚好像你名字里的一个字母", 90, 255);

      const tile = 196;
      const gap = 28;
      const totalWidth = columns * tile + (columns - 1) * gap;
      const startX = (canvas.width - totalWidth) / 2;

      await Promise.all(
        matches.map(async (match, index) => {
          const fallback = [
            "/covers/demo-j.png",
            "/covers/demo-o.png",
            "/covers/demo-n.png",
          ][index % 3];
          let image: HTMLImageElement;
          try {
            image = await loadCanvasImage(match.coverUrl, true);
          } catch {
            image = await loadCanvasImage(fallback);
          }

          const column = index % columns;
          const row = Math.floor(index / columns);
          const x = startX + column * (tile + gap);
          const y = 330 + row * 248;
          context.drawImage(image, x, y, tile, tile);
          context.fillStyle = "#151515";
          context.font = "700 25px Arial, sans-serif";
          context.fillText(match.letter, x, y + tile + 34);
        }),
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Export failed");

      const filename = `covertune-${submittedName.toLowerCase()}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      const shareData = {
        files: [file],
        title: `${submittedName} 的 CoverTune`,
        text: "我的专属封面歌单",
      };

      const isMobileDevice =
        navigator.maxTouchPoints > 0 &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobileDevice && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        notify("已打开系统面板，可选择“存储图像”");
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      notify("PNG 已下载到本地");
    } catch (saveError) {
      if (saveError instanceof DOMException && saveError.name === "AbortError") {
        notify("已取消保存");
        return;
      }
      notify("生成图片失败，请稍后重试");
    }
  };

  return (
    <>
      <MobileScroll className="app-screen">
        <main className="cover-tune" data-testid="cover-tune-screen">
          <header className="hero-header">
            <div className="brand-row">
              <button
                className="brand-button"
                type="button"
                aria-label="查看数据来源"
                onClick={() => {
                  dismissKeyboard();
                  setShowSource(true);
                }}
              >
                <span className="brand">CoverTune</span>
                <span className="brand-dot" aria-hidden="true" />
                <InfoCircledIcon aria-hidden="true" />
              </button>
              <span className="catalog-status">
                {sourceLabel(matches, catalogLoading, liveCandidates.length)}
              </span>
            </div>
            <h1>{submittedName}，这是你的封面歌单</h1>
            <p>每张封面，刚好像你名字里的一个字母</p>
          </header>

          <section
            className={`album-layout album-layout--${layout}`}
            aria-label={`${submittedName} 的专辑封面字母`}
            data-testid="album-layout"
            data-layout={layout}
          >
            <AnimatePresence mode="popLayout">
              {matches.map((match, index) => (
                <motion.article
                  className="album-card"
                  data-kind={match.kind}
                  key={`${match.id}-${index}-${seed}`}
                  layout
                  initial={{ opacity: 0, y: 26, rotate: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ delay: index * 0.055, duration: 0.38 }}
                >
                  <span className="letter-chip">代表 {match.letter}</span>
                  <button
                    className="cover-button"
                    type="button"
                    aria-label={`查看 ${match.title} 为什么代表 ${match.letter}`}
                    onClick={() => {
                      dismissKeyboard();
                      setSelected(match);
                    }}
                  >
                    <img
                      className="cover-image"
                      src={match.coverUrl}
                      alt={`${match.artist} 的《${match.title}》封面，代表字母 ${match.letter}`}
                      draggable={false}
                      onError={(event) => {
                        const fallbackCovers = [
                          "/covers/demo-j.png",
                          "/covers/demo-o.png",
                          "/covers/demo-n.png",
                        ];
                        const fallback = fallbackCovers[index % fallbackCovers.length];
                        if (!event.currentTarget.src.endsWith(fallback)) {
                          event.currentTarget.src = fallback;
                        }
                      }}
                    />
                    <span className="album-meta">
                      <span>
                        <strong>{match.title}</strong>
                        <small>{match.artist}</small>
                      </span>
                      <QuestionMarkCircledIcon aria-hidden="true" />
                    </span>
                  </button>
                </motion.article>
              ))}
            </AnimatePresence>
          </section>

          <section className="command-dock" aria-label="名字与保存操作">
            <label className="name-field" htmlFor="cover-name">
              <span>你的名字</span>
              <span className="field-line">
                <KeyboardInput
                  id="cover-name"
                  aria-describedby={error ? "name-error" : undefined}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  maxLength={30}
                  onBlur={() => keyboard.hide()}
                  onChange={(event) => {
                    setRawName(event.currentTarget.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitName();
                  }}
                  onFocus={(event) => {
                    alignNameInputAboveKeyboard(event.currentTarget);
                  }}
                  spellCheck={false}
                  value={rawName}
                />
                <Pencil2Icon aria-hidden="true" />
              </span>
              <small>{Math.min(inputCount, 10)} / 10</small>
            </label>

            <div className="dock-actions">
              <button
                className="primary-action"
                type="button"
                onClick={shuffle}
                aria-label="换一组封面"
              >
                <ReloadIcon aria-hidden="true" />
                <span>换一组</span>
              </button>
              <button
                className="round-action"
                type="button"
                onClick={savePoster}
                aria-label="保存结果图片到本地"
              >
                <DownloadIcon aria-hidden="true" />
                <span>存相册</span>
              </button>
            </div>
          </section>

          {error ? (
            <p className="input-error" id="name-error" role="alert">
              {error}
            </p>
          ) : null}

          <footer>
            <span>开放音乐条目：Internet Archive Netlabels</span>
            <span>生成封面仅作界面演示，不代表真实发行</span>
          </footer>
        </main>
      </MobileScroll>

      <BottomSheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? `${selected.letter} / ${selected.title}` : "匹配说明"}
        description={selected?.artist}
        snap={0.72}
      >
        {selected ? (
          <div className="match-sheet">
            <img
              src={selected.coverUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <p>{selected.explanation}</p>
            <p className="sheet-note">
              {selected.kind === "demo-art"
                ? "这是为视觉稿生成的演示封面，不是真实专辑。"
                : selected.kind === "visual-release"
                  ? "这是真实音乐发行，并已完成原型视觉预筛；封面版权归原权利方所有，仅用于本地原型展示，正式发布前仍需人工与权利审核。"
                  : "这是 Internet Archive Netlabels 中带许可字段的真实音乐条目；字母视觉标签仍需人工审核。"}
            </p>
            {selected.detailUrl ? (
              <div className="sheet-links">
                <a
                  href={selected.detailUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看音乐资料 <ExternalLinkIcon aria-hidden="true" />
                </a>
                {selected.licenseUrl ? (
                  <a
                    href={selected.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看许可 <ExternalLinkIcon aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={showSource}
        onOpenChange={setShowSource}
        title="开放目录与版权边界"
        description={`${VISUAL_LETTER_COUNT} 个字母 · ${VISUAL_CATALOG_COUNT} 张视觉候选`}
        snap={0.72}
      >
        <div className="source-sheet">
          <p>
            Demo 的真实音乐条目来自 Internet Archive Netlabels 的 Advanced
            Search API，并保留每条记录的 Creative Commons 许可链接。
          </p>
          <p>
            A–Z 每个字母都准备了至少 3 张完成原型视觉预筛的真实发行封面。“换一组”
            会在对应字母的候选池中轮换；同名里的重复字母也会优先使用不同封面。
          </p>
          <p>
            MusicBrainz 与 Cover Art Archive
            提供开放元数据与公共封面索引，但封面图片不等于统一开源授权，正式上线前仍需逐张确认使用权。
          </p>
          <a
            href="https://archive.org/details/netlabels"
            target="_blank"
            rel="noreferrer"
          >
            打开 Netlabels 目录 <ExternalLinkIcon aria-hidden="true" />
          </a>
        </div>
      </BottomSheet>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
