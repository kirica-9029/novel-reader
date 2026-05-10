const NovelReader = (() => {
  // 本文の取得・保存・再配信は行わず、公式URLへ送るための話一覧だけを生成する。
  function createReaderModel(novel) {
    const totalEpisodes = toNumber(novel.generalAllNo ?? novel.latestChapter);
    const lastReadEpisode = toNumber(novel.lastReadEpisode ?? novel.readChapter);
    const unreadEpisodes = Math.max(0, totalEpisodes - lastReadEpisode);

    return {
      title: novel.title || "",
      author: novel.author || "",
      story: novel.story || "",
      site: novel.site || "",
      ncode: normalizeNcode(novel.ncode),
      url: novel.url || "",
      generalLastup: novel.generalLastup || novel.updatedAt || "",
      totalEpisodes,
      lastReadEpisode,
      unreadEpisodes,
      episodes: createEpisodeList(novel, totalEpisodes, lastReadEpisode),
    };
  }

  function createEpisodeList(novel, totalEpisodes, lastReadEpisode) {
    if (!novel.ncode || totalEpisodes <= 0) return [];

    return Array.from({ length: totalEpisodes }, (_, index) => {
      const episode = index + 1;
      return {
        episode,
        title: `第${episode}話`,
        url: getNarouEpisodeUrl(novel.ncode, episode),
        read: episode <= lastReadEpisode,
      };
    });
  }

  function getNarouEpisodeUrl(ncode, episode) {
    return `https://ncode.syosetu.com/${String(ncode).toLowerCase()}/${episode}/`;
  }

  function normalizeNcode(value) {
    const match = String(value || "").trim().match(/^n\d{4}[a-z]+$/i);
    return match ? match[0].toUpperCase() : "";
  }

  function toNumber(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  return {
    createReaderModel,
    getNarouEpisodeUrl,
  };
})();
