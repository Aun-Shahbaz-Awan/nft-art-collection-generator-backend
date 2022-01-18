const basePath = process.cwd();
const AdmZip = require("adm-zip");
const multer = require("multer");
const fs = require("fs");
const jetpack = require("fs-jetpack");
// Js

// Express
const express = require("express"),
  app = express(),
  port = process.env.PORT || 5000,
  cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// multer storage
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  },
});
let upload = multer({ storage: storage });
// test -------------------------------------------------------- api
app.get("/", (req, res) => {
  res.send({ success: true });
});
// upload images -------------------------------------------------------- api
app.post(
  "/upload-images",
  upload.array("layerImages", 20),
  //   upload.single("file"),
  (req, res) => {
    if (!req.files) {
      console.log("No file received");
      return res.send({
        success: false,
      });
    } else {
      // Making new directry of "Layer Name"
      if (fs.existsSync(`layers/${req.body.layerName}`)) {
        fs.rmSync(`layers/${req.body.layerName}`, {
          recursive: true,
          force: true,
        });
      }
      fs.mkdirSync(
        `layers/${req.body.layerName}`,
        { recursive: true },
        function (err) {
          if (err) console.log(err);
          else
            console.log(
              'New directory "',
              req.body.layerName,
              '" successfully created.'
            );
        }
      );
      // Moving Layers from "uploads" to newly created folder "layer name"
      const src = jetpack.cwd("uploads");
      const dst = jetpack.cwd(`layers/${req.body.layerName}`);
      src.find({ matching: "*.png" }).forEach((filePath) => {
        src.move(filePath, dst.path(filePath), { overwrite: true });
      });
      //testing....
      console.log(req);
      return res.send({
        success: true,
      });
    }
    res.send(req);
  }
);
// generate collection -------------------------------------------------- api
app.post("/generate", upload.array("layerImages", 2), (req, res) => {
  console.log(req);
  let layersOrder = "";
  if (typeof req.body.layersOrder === "string") {
    console.log("if called");
    layersOrder = layersOrder.concat(`{name:"${req.body.layersOrder}"},`);
  } else
    for (let i = 0; i < req.body.layersOrder.length; i++) {
      layersOrder = layersOrder.concat(
        `{name:"${req.body.layersOrder[i].toString()}"},`
      );
      console.log("Els called");
    }
  // src/config.js file
  let content = `const basePath=process.cwd(),{MODE:MODE}=require(\`\${basePath}/constants/blend_mode.js\`),{NETWORK:NETWORK}=require(\`\${basePath}/constants/network.js\`),network=NETWORK.eth,namePrefix="${req.body.projectName}",description="${req.body.projectDescription}",baseUri="ipfs://NewUriToReplace",solanaMetadata={symbol:"YC",seller_fee_basis_points:1e3,external_url:"https://www.youtube.com/c/hashlipsnft",creators:[{address:"7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",share:100}]},layerConfigurations=[{growEditionSizeTo:${req.body.collectionSize},layersOrder:[ ${layersOrder}]}],shuffleLayerConfigurations=!1,debugLogs=!1,format={width:512,height:512,smoothing:!1},gif={export:!0,repeat:0,quality:100,delay:100},text={only:!1,color:"#ffffff",size:20,xGap:40,yGap:40,align:"left",baseline:"top",weight:"regular",family:"Courier",spacer:" => "},pixelFormat={ratio:2/128},background={generate:!0,brightness:"80%",static:!1,default:"#000000"},extraMetadata={},rarityDelimiter="#",uniqueDnaTorrance=1e4,preview={thumbPerRow:5,thumbWidth:50,imageRatio:format.height/format.width,imageName:"preview.png"},preview_gif={numberOfImages:5,order:"ASC",repeat:0,quality:100,delay:500,imageName:"preview.gif"};module.exports={format:format,baseUri:baseUri,description:description,background:background,uniqueDnaTorrance:1e4,layerConfigurations:layerConfigurations,rarityDelimiter:"#",preview:preview,shuffleLayerConfigurations:!1,debugLogs:!1,extraMetadata:extraMetadata,pixelFormat:pixelFormat,text:text,namePrefix:namePrefix,network:network,solanaMetadata:solanaMetadata,gif:gif,preview_gif:preview_gif};`;
  // Rewrite src/config.js file
  fs.writeFileSync("src/config.js", content, {
    encoding: "utf8",
    flag: "w",
  });

  const { startCreating, buildSetup } = require(`${basePath}/src/main.js`);
  (async () => {
    await buildSetup();
    await startCreating();
    fs.rmSync("layers", { recursive: true });
    fs.mkdirSync("layers", { recursive: true });
    res.send({
      success: true,
    });
  })();
});
// download zip --------------------------------------------------------- api
app.get("/get-zip", (req, res) => {
  // Converting Build folder to Zip
  const zip = new AdmZip();
  zip.addLocalFolder(`${basePath}/build`);
  const data = zip.toBuffer();
  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename=${"build.zip"}`);
  res.set("Content-Length", data.length);
  res.send(data);
});

// app.listen(port, () => console.log("Backend server live on " + port));

module.exports = app;
module.exports.handler = serverless(app);
