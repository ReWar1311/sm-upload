const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// GET /health – Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Multer – accept track (mp3), thumbnail (image), lyrics (lrc) in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max per file
  fileFilter: (_req, file, cb) => {
    const allowedFields = ["track", "thumbnail", "lyrics"];
    if (!allowedFields.includes(file.fieldname)) {
      return cb(new Error(`Unexpected field: ${file.fieldname}`));
    }
    cb(null, true);
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STARMAKER_BASE = "https://www.starmakerstudios.com";
const STARMAKER_API = "https://api.starmakerstudios.com";

const COMMON_HEADERS = {
  accept: "*/*",
  "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
  "sec-ch-ua":
    '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  Referer: `${STARMAKER_BASE}/tune/upload`,
};

/**
 * Build the cookie string required by StarMaker upload endpoints.
 * @param {object} auth - { oauth_token, user_id }
 * @param {string} [phpsessid] - optional PHPSESSID value
 * @returns {string}
 */
function buildCookieString(auth, phpsessid) {
  const h5Device = uuidv4();
  const h5Uuid = uuidv4();
  let cookie =
    `h5_device=${h5Device}; h5_uuid=${h5Uuid}; ` +
    `oauth_token=${auth.oauth_token}; user_id=${auth.user_id}`;
  if (phpsessid) cookie += `; PHPSESSID=${phpsessid}`;
  return cookie;
}

/**
 * Upload a file asset (track / thumbnail / lyrics) to StarMaker.
 */
async function uploadAsset(type, fieldName, file, cookies, extraFields = {}) {
  const form = new FormData();
  form.append("type", type);

  // Extra fields (e.g. instrumental_path for lyrics upload)
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }

  form.append(fieldName, file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const res = await fetch(`${STARMAKER_BASE}/songbook/upload`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      ...form.getHeaders(),
      cookie: cookies,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Upload ${type} failed (HTTP ${res.status}): ${text}`
    );
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(
      `Upload ${type} failed: ${json.msg || JSON.stringify(json)}`
    );
  }

  return json.data; // URL of the uploaded asset
}

/**
 * Submit the final song data to StarMaker.
 */
async function submitSong(payload, cookies) {
  // Build a multipart/form-data body identical to the browser request
  const form = new FormData();
  form.append("cover_img", payload.cover_img || "");
  form.append("instrumental_path", payload.instrumental_path || "");
  form.append("project_file", payload.project_file || "");
  form.append("artist_name", payload.artist_name || "");
  form.append("song_name", payload.song_name || "");
  form.append("album_name", payload.album_name || "");
  form.append("tags", payload.tags || "");
  form.append("language", payload.language || "en");
  form.append("email", payload.email || "");
  form.append("media_path", payload.media_path || "");
  form.append("lyric_path", payload.lyric_path || "");

  const res = await fetch(`${STARMAKER_BASE}/songbook/datas`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      accept: "application/json, text/plain, */*",
      ...form.getHeaders(),
      cookie: cookies,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Final upload failed (HTTP ${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(
      `Final upload failed: ${json.msg || JSON.stringify(json)}`
    );
  }

  return json;
}

// ---------------------------------------------------------------------------
// 1. POST /api/login – Proxy login to StarMaker
// ---------------------------------------------------------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "email and password are required" });
    }

    const body = new URLSearchParams({
      x_auth_mode: "email_login",
      x_auth_email: email,
      x_auth_password: password,
    });

    const response = await fetch(`${STARMAKER_API}/web/login`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language":
          "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua":
          '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-locale": "en",
        Referer: `${STARMAKER_BASE}/`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `StarMaker login failed (HTTP ${response.status})`,
        details: text,
      });
    }

    const data = await response.json();

    // Extract the fields the client will need for uploads
    return res.json({
      success: true,
      data: {
        user_id: data.id,
        oauth_token: data.oauth_token,
        stage_name: data.stage_name,
        profile_image: data.profile_image,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 2. POST /api/upload – Full upload pipeline
//    Expects multipart form with fields:
//      - track        (file, required) – MP3 instrumental
//      - thumbnail    (file, required) – JPG/PNG cover image
//      - lyrics       (file, optional) – LRC lyrics file
//      - oauth_token  (text, required)
//      - user_id      (text, required)
//      - artist_name  (text, required)
//      - song_name    (text, required)
//      - album_name   (text, optional)
//      - tags         (text, optional)
//      - language     (text, optional, default "en")
//      - email        (text, optional)
// ---------------------------------------------------------------------------
const uploadFields = upload.fields([
  { name: "track", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "lyrics", maxCount: 1 },
]);

app.post("/api/upload", uploadFields, async (req, res) => {
  try {
    // ----- Validate required inputs ----- //
    const { oauth_token, user_id, artist_name, song_name } = req.body;

    const missing = [];
    if (!oauth_token) missing.push("oauth_token");
    if (!user_id) missing.push("user_id");
    if (!artist_name) missing.push("artist_name");
    if (!song_name) missing.push("song_name");
    if (!req.files?.track?.[0]) missing.push("track (file)");
    if (!req.files?.thumbnail?.[0]) missing.push("thumbnail (file)");

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const auth = { oauth_token, user_id };
    const cookies = buildCookieString(auth);

    const trackFile = req.files.track[0];
    const thumbnailFile = req.files.thumbnail[0];
    const lyricsFile = req.files?.lyrics?.[0] || null;

    // ----- Step 1: Upload Track (instrumental) ----- //
    console.log("[1/4] Uploading track…");
    let instrumentalUrl;
    try {
      instrumentalUrl = await uploadAsset(
        "instrumental",
        "instrumental",
        trackFile,
        cookies
      );
    } catch (err) {
      return res.status(502).json({
        success: false,
        step: "upload_track",
        error: err.message,
      });
    }
    console.log("[1/4] Track uploaded:", instrumentalUrl);

    // ----- Step 2: Upload Thumbnail ----- //
    console.log("[2/4] Uploading thumbnail…");
    let coverImgUrl;
    try {
      coverImgUrl = await uploadAsset(
        "cover_img",
        "cover_img",
        thumbnailFile,
        cookies
      );
    } catch (err) {
      return res.status(502).json({
        success: false,
        step: "upload_thumbnail",
        error: err.message,
      });
    }
    console.log("[2/4] Thumbnail uploaded:", coverImgUrl);

    // ----- Step 3: Upload Lyrics (optional) ----- //
    let lyricUrl = "";
    if (lyricsFile) {
      console.log("[3/4] Uploading lyrics…");
      try {
        lyricUrl = await uploadAsset("lyric", "lyric", lyricsFile, cookies, {
          instrumental_path: instrumentalUrl,
        });
      } catch (err) {
        return res.status(502).json({
          success: false,
          step: "upload_lyrics",
          error: err.message,
        });
      }
      console.log("[3/4] Lyrics uploaded:", lyricUrl);
    } else {
      console.log("[3/4] No lyrics file provided – skipping.");
    }

    // ----- Step 4: Final Upload (submit song metadata) ----- //
    console.log("[4/4] Submitting final song data…");
    let result;
    try {
      result = await submitSong(
        {
          cover_img: coverImgUrl,
          instrumental_path: instrumentalUrl,
          artist_name,
          song_name,
          album_name: req.body.album_name || "",
          tags: req.body.tags || "",
          language: req.body.language || "en",
          email: req.body.email || "",
          lyric_path: lyricUrl,
        },
        cookies
      );
    } catch (err) {
      return res.status(502).json({
        success: false,
        step: "final_upload",
        error: err.message,
      });
    }
    console.log("[4/4] Song submitted successfully!");

    return res.json({
      success: true,
      message: "Song uploaded successfully!",
      data: {
        instrumental_url: instrumentalUrl,
        cover_img_url: coverImgUrl,
        lyric_url: lyricUrl || null,
        starmaker_response: result,
      },
    });
  } catch (err) {
    console.error("Upload pipeline error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  return res
    .status(500)
    .json({ success: false, error: err.message });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`StarMaker upload proxy running on http://localhost:${PORT}`);
  console.log(`  POST /api/login   – Login to StarMaker`);
  console.log(`  POST /api/upload  – Upload a song (full pipeline)`);
});
