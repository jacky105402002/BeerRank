import type { Locale } from "@beerrank/shared";

type Dictionary = {
  nav: {
    feed: string;
    ranking: string;
    add: string;
    ai: string;
    profile: string;
  };
  common: {
    beerRank: string;
    verified: string;
    public: string;
    private: string;
    viewFeed: string;
    beerDetail: string;
    continue: string;
    back: string;
  };
  feed: {
    title: string;
    subtitle: string;
    loginTitle: string;
    loginBody: string;
  };
  review: {
    title: string;
    subtitle: string;
    photos: string;
    visibility: string;
    rating: string;
    beer: string;
    note: string;
    confirmAi: string;
    publish: string;
    successTitle: string;
  };
  ai: {
    title: string;
    high: string;
    low: string;
    noResult: string;
    useBeer: string;
    createBeer: string;
  };
  leaderboard: {
    title: string;
    trust: string;
  };
  profile: {
    title: string;
    sync: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  "zh-TW": {
    nav: {
      feed: "動態",
      ranking: "排行",
      add: "發布",
      ai: "AI",
      profile: "我的"
    },
    common: {
      beerRank: "BeerRank",
      verified: "已驗證",
      public: "公開",
      private: "私人",
      viewFeed: "查看動態",
      beerDetail: "啤酒詳情",
      continue: "繼續",
      back: "返回"
    },
    feed: {
      title: "啤酒動態",
      subtitle: "每則公開評分都來自實際發布的喝酒紀錄。",
      loginTitle: "需要登入",
      loginBody: "登入後可以按讚、留言、收藏與發布酒評。"
    },
    review: {
      title: "新增酒評",
      subtitle: "最多 3 張照片，第一張會成為主要證明照片。",
      photos: "照片",
      visibility: "可見性",
      rating: "評分",
      beer: "啤酒",
      note: "心得",
      confirmAi: "用 AI 確認啤酒",
      publish: "發布酒評",
      successTitle: "發布成功"
    },
    ai: {
      title: "確認是哪一款 Beer",
      high: "高信心匹配",
      low: "低信心，需要人工確認",
      noResult: "找不到結果",
      useBeer: "使用這款 Beer",
      createBeer: "建立新 Beer"
    },
    leaderboard: {
      title: "啤酒排行榜",
      trust: "只採計公開酒評；每筆分數都能回到實際照片與心得。"
    },
    profile: {
      title: "個人檔案",
      sync: "使用 Google 登入即可同步你的酒評。"
    }
  },
  en: {
    nav: {
      feed: "Feed",
      ranking: "Ranking",
      add: "Post",
      ai: "AI",
      profile: "Profile"
    },
    common: {
      beerRank: "BeerRank",
      verified: "Verified",
      public: "Public",
      private: "Private",
      viewFeed: "View Feed",
      beerDetail: "Beer Detail",
      continue: "Continue",
      back: "Back"
    },
    feed: {
      title: "Beer Feed",
      subtitle: "Every public rating comes from a real published drinking post.",
      loginTitle: "Login required",
      loginBody: "Sign in to like, comment, save, and publish reviews."
    },
    review: {
      title: "Add Review",
      subtitle: "Upload up to 3 photos. The first photo becomes the primary proof image.",
      photos: "Photos",
      visibility: "Visibility",
      rating: "Rating",
      beer: "Beer",
      note: "Tasting note",
      confirmAi: "Confirm Beer with AI",
      publish: "Publish Review",
      successTitle: "Published"
    },
    ai: {
      title: "Confirm Your Beer",
      high: "High-confidence match",
      low: "Low confidence, manual confirmation needed",
      noResult: "No results",
      useBeer: "Use this Beer",
      createBeer: "Create New Beer"
    },
    leaderboard: {
      title: "Beer Leaderboard",
      trust: "Only public reviews are ranked, and every score links back to real photos and notes."
    },
    profile: {
      title: "Profile",
      sync: "Continue with Google to sync your reviews."
    }
  }
};

export function detectLocale(language: string): Locale {
  return language.toLowerCase().startsWith("zh") ? "zh-TW" : "en";
}
