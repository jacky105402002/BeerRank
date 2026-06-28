import { NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { type ChangeEvent, useMemo, useState } from "react";
import type { BeerSummaryDto, Locale, ReviewVisibility, UploadReviewPhotoInputDto } from "../types";
import {
  beerDetail,
  beers,
  commentsByPostId,
  highConfidenceMatch,
  leaderboard,
  lowConfidenceMatch,
  posts,
  profiles
} from "../data/mock/mockData";
import { beerRankApi } from "../data/api/beerRankApi";
import { useApiResource } from "../data/api/useApiResource";
import { detectLocale, dictionaries } from "../i18n/dictionaries";
import "../styles/app.css";

type T = typeof dictionaries.en;

type DraftState = {
  photoUrls: string[];
  rating: number;
  visibility: ReviewVisibility;
  confirmedBeer?: BeerSummaryDto;
};

type IconName = "heart" | "comment" | "bookmark" | "bell" | "feed" | "ranking" | "plus" | "ai" | "profile";

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M20.8 4.6c-1.7-1.7-4.5-1.6-6.2.2L12 7.5 9.4 4.8C7.7 3 4.9 2.9 3.2 4.6 1.4 6.4 1.5 9.3 3.4 11.1L12 19.5l8.6-8.4c1.9-1.8 2-4.7.2-6.5Z" />
      </svg>
    );
  }
  if (name === "comment") {
    return (
      <svg {...common}>
        <path d="M21 11.5a8.4 8.4 0 0 1-8.7 8.2 9.2 9.2 0 0 1-3.7-.8L3 20l1.2-4.3A8 8 0 0 1 3 11.5a8.4 8.4 0 0 1 8.7-8.2 8.4 8.4 0 0 1 9.3 8.2Z" />
      </svg>
    );
  }
  if (name === "bookmark") {
    return (
      <svg {...common}>
        <path d="M6 4.8C6 3.8 6.8 3 7.8 3h8.4c1 0 1.8.8 1.8 1.8V21l-6-3.5L6 21V4.8Z" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </svg>
    );
  }
  if (name === "feed") {
    return (
      <svg {...common}>
        <path d="M5 5h14" />
        <path d="M5 12h14" />
        <path d="M5 19h10" />
      </svg>
    );
  }
  if (name === "ranking") {
    return (
      <svg {...common}>
        <path d="M6 20V10" />
        <path d="M12 20V4" />
        <path d="M18 20v-7" />
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }
  if (name === "ai") {
    return (
      <svg {...common}>
        <path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z" />
        <path d="M19 16l.7 2.2L22 19l-2.3.8L19 22l-.7-2.2L16 19l2.3-.8L19 16Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export function App() {
  const locale = useMemo<Locale>(() => detectLocale(navigator.language || "en"), []);
  const t = dictionaries[locale];
  const [loginOpen, setLoginOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>({
    photoUrls: [],
    rating: 4,
    visibility: "public"
  });

  return (
    <div className="app-bg">
      <div className="phone-shell">
        <header className="topbar">
          <div className="brand-mark">BR</div>
          <strong>{t.common.beerRank}</strong>
          <button className="icon-button" onClick={() => setLoginOpen(true)} aria-label="Notifications">
            <Icon name="bell" />
          </button>
        </header>
        <main className="screen">
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage t={t} onLogin={() => setLoginOpen(true)} onComments={setCommentsOpen} />} />
            <Route path="/review/new" element={<ReviewPage t={t} draft={draft} setDraft={setDraft} />} />
            <Route path="/review/new/match" element={<MatchPage t={t} locale={locale} draft={draft} setDraft={setDraft} />} />
            <Route path="/beers/:beerId" element={<BeerDetailPage t={t} onLogin={() => setLoginOpen(true)} />} />
            <Route path="/leaderboard" element={<LeaderboardPage t={t} />} />
            <Route path="/profile" element={<ProfilePage t={t} />} />
          </Routes>
        </main>
        <BottomNav t={t} />
        {loginOpen ? <LoginSheet t={t} onClose={() => setLoginOpen(false)} /> : null}
        {commentsOpen ? <CommentSheet postId={commentsOpen} t={t} onClose={() => setCommentsOpen(null)} /> : null}
      </div>
    </div>
  );
}

function BottomNav({ t }: { t: T }) {
  return (
    <nav className="bottom-nav">
      <NavLink to="/feed"><Icon name="feed" /><span>{t.nav.feed}</span></NavLink>
      <NavLink to="/leaderboard"><Icon name="ranking" /><span>{t.nav.ranking}</span></NavLink>
      <NavLink to="/review/new" className="add-link"><Icon name="plus" /><span>{t.nav.add}</span></NavLink>
      <NavLink to="/profile"><Icon name="profile" /><span>{t.nav.profile}</span></NavLink>
    </nav>
  );
}

function FeedPage({ t, onLogin, onComments }: { t: T; onLogin: () => void; onComments: (id: string) => void }) {
  const navigate = useNavigate();
  const feed = useApiResource(() => beerRankApi.getFeed(), { items: posts }, []);
  return (
    <section className="page">
      <h1>{t.feed.title}</h1>
      <p className="muted">{t.feed.subtitle}</p>
      {feed.error ? <p className="muted">Mock API unavailable. Showing local fallback.</p> : null}
      <div className="feed-list">
        {feed.data.items.map((post) => (
          <article className="post-card" key={post.id}>
            <div className="post-author">
              <img src={post.author.avatarUrl} alt="" />
              <div>
                <strong>{post.author.displayName}</strong>
                <span>{post.beer.brewery.name}</span>
              </div>
              <span className="visibility-pill">{post.visibility === "public" ? t.common.public : t.common.private}</span>
            </div>
            <button className="image-button" onClick={() => navigate(`/beers/${post.beer.id}`)}>
              <img src={post.primaryPhotoUrl} alt={post.beer.name} />
            </button>
            <div className="post-body">
              <button className="link-title" onClick={() => navigate(`/beers/${post.beer.id}`)}>{post.beer.name}</button>
              <div className="row">
                <span>{post.beer.style}</span>
                <span className="stars" aria-label={`${post.rating} stars`}>★★★★★</span>
                <b>{post.rating.toFixed(1)}</b>
              </div>
              <p>{post.reviewText}</p>
              {post.isRankingEligible ? <span className="verified">{t.common.verified}</span> : null}
            </div>
            <div className="actions">
              <button onClick={onLogin}><Icon name="heart" /> <span>{post.likeCount}</span></button>
              <button onClick={() => onComments(post.id)}><Icon name="comment" /> <span>{post.commentCount}</span></button>
              <button onClick={onLogin} aria-label="Save"><Icon name="bookmark" /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

async function imageFileToUploadInput(file: File): Promise<UploadReviewPhotoInputDto> {
  const image = await readImage(file);
  const canvas = document.createElement("canvas");
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

  return {
    fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
    mimeType: "image/jpeg",
    dataUrl
  };
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image could not be decoded"));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Image could not be read"));
    reader.readAsDataURL(file);
  });
}

function ReviewPage({
  t,
  draft,
  setDraft
}: {
  t: T;
  draft: DraftState;
  setDraft: (draft: DraftState | ((current: DraftState) => DraftState)) => void;
}) {
  const navigate = useNavigate();
  const isReady = draft.photoUrls.length > 0 && draft.rating > 0 && draft.confirmedBeer;
  const query = new URLSearchParams(location.search);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "error">("idle");

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []).slice(0, 3);
    if (selectedFiles.length === 0) {
      return;
    }

    setUploadState("uploading");
    try {
      const files = await Promise.all(selectedFiles.map((file) => imageFileToUploadInput(file)));
      const response = await beerRankApi.uploadReviewPhotos({ files });
      setDraft((current) => ({
        ...current,
        photoUrls: response.photos.sort((a, b) => a.sortOrder - b.sortOrder).map((photo) => photo.url)
      }));
      setUploadState("idle");
    } catch {
      setUploadState("error");
    } finally {
      event.target.value = "";
    }
  }

  async function publishReview() {
    if (!draft.confirmedBeer || draft.photoUrls.length === 0) {
      return;
    }

    setPublishState("publishing");
    try {
      await beerRankApi.createReview({
        beerId: draft.confirmedBeer.id,
        photoUrls: draft.photoUrls,
        rating: draft.rating,
        reviewText: "Citrus aroma, crisp body, and a clean bitter finish.",
        visibility: draft.visibility
      });
      setPublishState("idle");
      navigate("/review/new?published=true");
    } catch {
      setPublishState("error");
    }
  }
  return (
    <section className="page">
      <h1>{t.review.title}</h1>
      <p className="muted">{t.review.subtitle}</p>
      <input
        id="review-photo-input"
        className="file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handlePhotoChange}
      />
      <div className="photo-grid">
        {draft.photoUrls.slice(0, 3).map((url, index) => (
          <div className={index === 0 ? "photo primary" : "photo"} key={url}>
            <img src={url} alt="" />
            <span>{index === 0 ? "主要照片" : index + 1}</span>
          </div>
        ))}
        {draft.photoUrls.length < 3 ? <div className="photo add-photo">+ 新增</div> : null}
      </div>
      <label className="secondary upload-trigger" htmlFor="review-photo-input">
        {uploadState === "uploading" ? "Uploading photos..." : "Choose photos"}
      </label>
      {uploadState === "error" ? <p className="form-error">Photo upload failed. Use JPG, PNG, or WebP, up to 3 photos.</p> : null}
      <div className="panel">
        <label>{t.review.visibility}</label>
        <div className="segmented">
          <button className={draft.visibility === "public" ? "active" : ""} onClick={() => setDraft({ ...draft, visibility: "public" })}>{t.common.public}</button>
          <button className={draft.visibility === "private" ? "active" : ""} onClick={() => setDraft({ ...draft, visibility: "private" })}>{t.common.private}</button>
        </div>
        <small>{draft.visibility === "public" ? "公開酒評符合條件時會計入排行榜。" : "私人酒評只會保留在你的個人紀錄。"}</small>
      </div>
      <div className="panel">
        <label>{t.review.rating}</label>
        <div className="big-stars">★★★★☆ <b>{draft.rating.toFixed(1)}</b></div>
      </div>
      <div className="panel">
        <label>{t.review.beer}</label>
        {draft.confirmedBeer ? <div className="confirmed">已確認：{draft.confirmedBeer.name}</div> : <p className="muted">尚未確認 Beer。</p>}
        <button className="secondary" onClick={() => navigate("/review/new/match")}>{t.review.confirmAi}</button>
      </div>
      <div className="panel">
        <label>{t.review.note}</label>
        <p className="mock-input">柑橘香氣明顯，苦韻乾淨，尾段收得很舒服。</p>
      </div>
      <button className="primary" disabled={!isReady || publishState === "publishing"} onClick={publishReview}>
        {publishState === "publishing" ? "Publishing..." : t.review.publish}
      </button>
      {publishState === "error" ? <p className="form-error">Publishing failed. Please try again.</p> : null}
      {query.has("published") ? <PublishSuccess t={t} /> : null}
    </section>
  );
}

function PublishSuccess({ t }: { t: T }) {
  const navigate = useNavigate();
  return (
    <div className="success-card">
      <div className="success-icon">✓</div>
      <h2>{t.review.successTitle}</h2>
      <p>這則公開酒評已具備照片、評分與已確認 Beer，會納入排行榜計算。</p>
      <button className="primary" onClick={() => navigate("/feed")}>{t.common.viewFeed}</button>
      <button className="secondary" onClick={() => navigate("/beers/beer-citra-ipa")}>{t.common.beerDetail}</button>
    </div>
  );
}

function MatchPage({
  t,
  locale,
  draft,
  setDraft
}: {
  t: T;
  locale: Locale;
  draft: DraftState;
  setDraft: (updater: DraftState | ((current: DraftState) => DraftState)) => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"high" | "low" | "none" | "create">("high");
  const matchMode = mode === "low" ? "low" : mode === "none" ? "none" : "high";
  const fallbackMatch = mode === "high" ? highConfidenceMatch : lowConfidenceMatch;
  const { data: match } = useApiResource(
    () => beerRankApi.matchBeer({ photoUrls: draft.photoUrls, locale, mode: matchMode }),
    fallbackMatch,
    [draft.photoUrls.join("|"), locale, matchMode]
  );
  const candidate = match.candidates[0];
  function confirmBeer(beer = candidate.beer) {
    setDraft((current) => ({ ...current, confirmedBeer: beer }));
    navigate("/review/new");
  }
  return (
    <section className="page">
      <h1>{t.ai.title}</h1>
      <p className="muted">這一步會在你上傳照片並填寫酒評後，用來確認 Beer 是否匹配。</p>
      <div className="tabs">
        <button className={mode === "high" ? "active" : ""} onClick={() => setMode("high")}>{t.ai.high}</button>
        <button className={mode === "low" ? "active" : ""} onClick={() => setMode("low")}>{t.ai.low}</button>
        <button className={mode === "none" ? "active" : ""} onClick={() => setMode("none")}>{t.ai.noResult}</button>
      </div>
      {mode === "none" ? (
        <div className="panel hero-panel">
          <h2>{t.ai.noResult}</h2>
          <p className="muted">可以換一張照片、手動搜尋，或建立新的 Beer 紀錄。</p>
          <button className="primary" onClick={() => setMode("create")}>{t.ai.createBeer}</button>
          <button className="secondary" onClick={() => navigate("/review/new")}>{t.common.back}</button>
        </div>
      ) : mode === "create" ? (
        <div className="panel">
          <h2>{t.ai.createBeer}</h2>
          <p className="mock-input">Morning Haze IPA</p>
          <p className="mock-input">Cloudburst Brewing</p>
          <p className="mock-input">IPA · 6.5%（選填）</p>
          <button className="primary" onClick={() => confirmBeer(beers[0])}>建立並確認</button>
        </div>
      ) : (
        <div className="match-card">
          <img src={candidate.beer.imageUrl} alt={candidate.beer.name} />
          <div>
            <span className="verified">{Math.round(candidate.confidenceScore * 100)}% Match</span>
            <h2>{candidate.beer.name}</h2>
            <p>{candidate.beer.brewery.name} · {candidate.beer.style}</p>
            <ul>
              {candidate.reasons.map((reason) => <li key={reason.label}>{reason.label}</li>)}
            </ul>
            <button className="primary" onClick={() => confirmBeer()}>{t.ai.useBeer}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function BeerDetailPage({ t, onLogin }: { t: T; onLogin: () => void }) {
  const navigate = useNavigate();
  const { beerId = "beer-citra-ipa" } = useParams();
  const { data: detail, error } = useApiResource(() => beerRankApi.getBeerDetail(beerId), beerDetail, [beerId]);
  return (
    <section className="page">
      {error ? <p className="muted">Mock API unavailable. Showing local fallback.</p> : null}
      <div className="beer-hero">
        <img src={detail.beer.imageUrl} alt={detail.beer.name} />
        <div>
          <span className="style-chip">{detail.beer.style}</span>
          <h1>{detail.beer.name}</h1>
          <p>{detail.beer.brewery.name} · {detail.beer.abv}% ABV</p>
        </div>
      </div>
      <div className="stats">
        <div><b>{detail.stats.averageRating}</b><span>平均</span></div>
        <div><b>#{detail.stats.rank}</b><span>{detail.stats.rankScope}</span></div>
        <div><b>{detail.stats.verifiedReviewCount}</b><span>公開酒評</span></div>
      </div>
      <button className="primary" onClick={() => navigate("/review/new")}>新增我的酒評</button>
      <div className="ranking-note">
        <span>排行榜依據</span>
        <p>{t.leaderboard.trust}</p>
      </div>
      <h2>公開佐證</h2>
      {detail.proofReviews.map((review) => (
        <article className="proof-card" key={review.id}>
          <img src={review.primaryPhotoUrl} alt="" />
          <div>
            <strong>{review.author.displayName}</strong>
            <p>{review.reviewText}</p>
            <button onClick={onLogin}><Icon name="heart" /> {review.likeCount}</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function LeaderboardPage({ t }: { t: T }) {
  const navigate = useNavigate();
  const ranking = useApiResource(() => beerRankApi.getLeaderboard("all"), { items: leaderboard }, []);
  return (
    <section className="page leaderboard-page">
      <h1>{t.leaderboard.title}</h1>
      {ranking.error ? <p className="muted">Mock API unavailable. Showing local fallback.</p> : null}
      <div className="ranking-note">
        <span>排行榜依據</span>
        <p>{t.leaderboard.trust}</p>
      </div>
      <div className="chip-row leaderboard-filters">
        {["All", "IPA", "Pilsner", "Stout", "Sour"].map((style) => <span className="filter-chip" key={style}>{style}</span>)}
      </div>
      <div className="ranking-list">
        {ranking.data.items.map((row) => (
          <button className="ranking-row" key={row.beer.id} onClick={() => navigate(`/beers/${row.beer.id}`)}>
            <b>{row.rank}</b>
            <img src={row.beer.imageUrl} alt="" />
            <span><strong>{row.beer.name}</strong><small>{row.beer.brewery.name}</small></span>
            <em>{row.averageRating.toFixed(1)}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfilePage({ t }: { t: T }) {
  const { data } = useApiResource(() => beerRankApi.getMe(), { user: profiles[2] }, []);
  const profile = data.user ?? profiles[2];
  return (
    <section className="page">
      <div className="profile-head">
        <img src={profile.avatarUrl} alt="" />
        <h1>{profile.displayName}</h1>
        <p>{profile.bio}</p>
      </div>
      <div className="stats">
        <div><b>{profile.reviewCount}</b><span>酒評</span></div>
        <div><b>{profile.averageGivenRating}</b><span>平均</span></div>
        <div><b>{profile.topStyle}</b><span>偏好</span></div>
      </div>
      <div className="panel">
        <h2>{t.profile.title}</h2>
        <p className="muted">{t.profile.sync}</p>
        <button className="secondary">使用 Google 繼續</button>
      </div>
    </section>
  );
}

function LoginSheet({ t, onClose }: { t: T; onClose: () => void }) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet">
        <h2>{t.feed.loginTitle}</h2>
        <p>{t.feed.loginBody}</p>
        <button className="primary" onClick={onClose}>使用 Google 繼續</button>
        <button className="ghost" onClick={onClose}>稍後再說</button>
      </div>
    </div>
  );
}

function CommentSheet({ postId, t, onClose }: { postId: string; t: T; onClose: () => void }) {
  const fallbackComments = { items: commentsByPostId[postId] ?? [] };
  const { data } = useApiResource(() => beerRankApi.getComments(postId), fallbackComments, [postId]);
  const comments = data.items;
  return (
    <div className="sheet-backdrop">
      <div className="sheet tall">
        <h2>留言</h2>
        {comments.map((comment) => (
          <div className="comment" key={comment.id}>
            <strong>{comment.author.displayName}</strong>
            <p>{comment.body}</p>
            <small>喜歡 {comment.likeCount}</small>
            {comment.replies?.map((reply) => (
              <div className="reply" key={reply.id}>
                <strong>{reply.author.displayName}</strong>
                <p>{reply.body}</p>
              </div>
            ))}
          </div>
        ))}
        <div className="comment-input">新增留言...</div>
        <button className="primary" onClick={onClose}>{t.common.continue}</button>
      </div>
    </div>
  );
}
