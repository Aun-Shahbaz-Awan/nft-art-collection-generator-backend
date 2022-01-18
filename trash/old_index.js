const basePath = process.cwd();
const AdmZip = require("adm-zip");
// Api
const express = require("express"),
  app = express(),
  port = process.env.PORT || 5000,
  cors = require("cors");
app.use(cors());
// Configuration
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
} = require(`${basePath}/src/config.js`);
// Main
const { startCreating, buildSetup } = require(`${basePath}/src/main.js`);

app.get("/", (req, res) => {
  res.send({ message: "Just do it!" });
});
app.get("/build", (req, res) => {
  (() => {
    buildSetup();
    startCreating();
    // Converting Build folder to Zip
    const zip = new AdmZip();
    zip.addLocalFolder(`${basePath}/build`);
    const data = zip.toBuffer();
    res.set("Content-Type", "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename=${"build.zip"}`);
    res.set("Content-Length", data.length);
    res.send(data);
  })();
  res.send({ message: "Build Done!" });
});

app.listen(port, () => console.log("Backend server live on " + port));
