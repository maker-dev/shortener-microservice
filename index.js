const dotenv = require("dotenv");
const express = require('express');
const cors = require('cors');
const dns = require("dns").promises;
const mongoose = require("mongoose");
const ShortUrl = require("./models/ShortUrl");
const app = express();

dotenv.config();



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connect to mongodb
mongoose.connect(process.env.DB_URL);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// desc: to register/get shorturl
app.post('/api/shorturl', async (req, res) => {
  
  const { url } = req.body;

  const re = /^http(s)?:\/\//;

  if (!re.test(url)) {
    return res.json({
      error: 'invalid url'
    })
  }

  try {
      // Parse the URL to extract the hostname
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Perform DNS lookup using promises
      await dns.lookup(hostname);

      const existingShortUrl = await ShortUrl.findOne({original_url: url});

      if (existingShortUrl) {

        return res.status(200).send({
          original_url: existingShortUrl.original_url,
          short_url: existingShortUrl.short_url
        });

      } else {
        
        const counter = await ShortUrl.countDocuments();
        
        const newShortUrl = new ShortUrl({
          original_url: url,
          short_url: counter + 1
        });

        await newShortUrl.save();

        return res.status(200).send({
          original_url: newShortUrl.original_url,
          short_url: newShortUrl.short_url
        });
      }
  
  } catch (err) {

      if (err?.code === "ENOTFOUND") {
        res.status(400).send({ error: "invalid Hostname" });
      } else {
        res.status(400).send({ error: err.message});
      }

  }
});



//desc: to use shorturl
app.get('/api/shorturl/:urlId', async (req, res) => {
  
  const {urlId} = req.params;

  if (isNaN(Number(urlId))) return res.status(400).send({error: "Wrong format"})

  try {
    
    const shortUrl = await ShortUrl.findOne({short_url: urlId});

    if (shortUrl) {
      return res.redirect(shortUrl.original_url);
    } else {
      return res.status(400).send({error: "No short URL found for the given input"})
    }

  } catch (err) {
    return res.status(400).send({error: err.message});
  }
 

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
