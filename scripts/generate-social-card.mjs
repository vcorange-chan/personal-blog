import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F5F1E8"/>
  <rect x="42" y="42" width="1116" height="546" rx="34" fill="none" stroke="#9A3F2F" stroke-width="8"/>
  <rect x="82" y="82" width="1036" height="466" rx="24" fill="#FFF9EC" opacity=".58"/>
  <text x="120" y="150" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#9A3F2F">CC</text>
  <text x="180" y="150" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#211B16">Clifford Chen</text>
  <text x="120" y="292" font-family="Georgia, serif" font-size="76" font-weight="700" fill="#211B16">Clifford Chen</text>
  <text x="120" y="366" font-family="Georgia, serif" font-size="38" fill="#6F6254">A place for mathematics, software,</text>
  <text x="120" y="418" font-family="Georgia, serif" font-size="38" fill="#6F6254">and long-form thinking.</text>
  <line x1="120" y1="486" x2="1080" y2="486" stroke="#7B4A2F" stroke-width="4"/>
  <text x="120" y="538" font-family="Inter, Arial, sans-serif" font-size="28" fill="#276B60">cliffordchen.org</text>
  <text x="700" y="538" font-family="Inter, Arial, sans-serif" font-size="26" fill="#7B4A2F">math · tech · academia · languages</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/social-card.png");

console.log("Generated public/social-card.png");
