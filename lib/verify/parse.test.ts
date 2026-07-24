import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYouTubeUrl } from "./youtube.ts";
import { parseTikTokUrl, parseInstagramUrl, parseFacebookUrl } from "./others.ts";
import { simulatedViews, curveFor, fnv1a } from "./simulated.ts";

test("YouTube URL forms all resolve to the same canonical id", () => {
  const id = "dQw4w9WgXcQ";
  const urls = [
    `https://www.youtube.com/shorts/${id}`,
    `https://youtube.com/shorts/${id}?feature=share`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/watch?v=${id}&t=5s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/live/${id}`,
  ];
  for (const u of urls) {
    const p = parseYouTubeUrl(u);
    assert.ok(p, `failed on ${u}`);
    assert.equal(p.mediaId, id);
    assert.equal(p.canonicalUrl, `https://www.youtube.com/shorts/${id}`);
  }
});

test("YouTube rejects non-video URLs and bad ids", () => {
  assert.equal(parseYouTubeUrl("https://www.youtube.com/@somechannel"), null);
  assert.equal(parseYouTubeUrl("https://www.youtube.com/shorts/short"), null); // ≠11 chars
  assert.equal(parseYouTubeUrl("https://vimeo.com/12345"), null);
  assert.equal(parseYouTubeUrl("not a url"), null);
});

test("TikTok / Instagram / Facebook parsing", () => {
  const tt = parseTikTokUrl("https://www.tiktok.com/@democlips/video/7300000000000000001?is_from_webapp=1");
  assert.ok(tt);
  assert.equal(tt.mediaId, "7300000000000000001");

  const ig = parseInstagramUrl("https://www.instagram.com/reel/C8abcDEfGhi/?igsh=xyz");
  assert.ok(ig);
  assert.equal(ig.mediaId, "C8abcDEfGhi");
  assert.ok(parseInstagramUrl("https://www.instagram.com/p/C8abcDEfGhi/"));

  const fbReel = parseFacebookUrl("https://www.facebook.com/reel/123456789012345");
  assert.ok(fbReel);
  assert.equal(fbReel.mediaId, "123456789012345");
  assert.ok(parseFacebookUrl("https://www.facebook.com/watch/?v=123456789012345"));
  assert.ok(parseFacebookUrl("https://fb.watch/abc12345/"));

  assert.equal(parseTikTokUrl("https://www.tiktok.com/@democlips"), null);
  assert.equal(parseInstagramUrl("https://www.instagram.com/democlips/"), null);
  assert.equal(parseFacebookUrl("https://www.facebook.com/somepage"), null);
});

test("simulated curve: deterministic, monotonic, bounded", () => {
  const id = "7300000000000000001";
  // deterministic
  assert.equal(simulatedViews(id, 24), simulatedViews(id, 24));
  assert.equal(fnv1a(id), fnv1a(id));
  // monotonic over hour buckets
  let prev = 0;
  for (let h = 0; h <= 168; h += 6) {
    const v = simulatedViews(id, h);
    assert.ok(v >= prev, `views decreased at h=${h}: ${prev} → ${v}`);
    prev = v;
  }
  // bounded by the curve's cap (+jitter margin)
  const { cap } = curveFor(id);
  assert.ok(cap >= 2000 && cap <= 80000);
  assert.ok(simulatedViews(id, 10_000) <= cap * 1.04);
  // different ids → different curves (overwhelmingly)
  assert.notEqual(simulatedViews("otherMedia01", 24), simulatedViews(id, 24));
});
