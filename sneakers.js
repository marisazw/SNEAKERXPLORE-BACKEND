const https = require("https");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Thread = require("./models/thread.js")
const User  =require("./models/user.js")
const ObjectId = require("mongoose").Types.ObjectId;

const app = express();
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
require('dotenv').config();


app.use(cors());
app.use(express.json())
app.use(express.urlencoded())



 
  const connectDb = async () => {
    const DB_CONNECTION_STRING ="mongodb+srv://mustafaismailmab:mumu123@cluster0.kmefq4m.mongodb.net/?retryWrites=true&w=majority";
    try {
      await mongoose.connect(DB_CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected successfully');
      console.log('MongoDB connection state:', mongoose.connection.readyState);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  };
  

// Function to generate a slug from a given string
function generateSlug(text) {
  return text.toString().toLowerCase()
      .replace(/\s+/g, '-')        
      .replace(/[^\w-]+/g, '')     
      .replace(/--+/g, '-')        
      .replace(/^-+/, '')         
      .replace(/-+$/, '');         
}

// Function to fetch buildId
async function fetchBuildId() {
  try {
    const response = await axios.get('https://www.sneakerjagers.com/');
    // Extracting buildId from response
    const buildId = response.data.match(/"buildId":"(.*?)"/)[1];
    return buildId;
  } catch (error) {
    throw new Error("Error fetching buildId: " + error.message);
  }
}

app.get("/sneakers", async (req, res) => {
  const page = req.query.page || 0;
  const perPage = req.query.perPage || 100;

  try {
    // Fetching  buildId
    const buildId = await fetchBuildId();

    const options = {
      method: "GET",
      hostname: "www.sneakerjagers.com",
      port: null,
      //page limit
      path: `/api/sneakers?page=${page}&limit=${perPage}`,
      headers: {
        Authorization: "Bearer 3596|TjLohpmQOZ01GCtwit6braWmldNwzrojyKVvMQ0N",
      },
    };

    const request = https.request(options, function (response) {
      let data = "";

      response.on("data", function (chunk) {
        data += chunk;
      });

      response.on("end", function () {
        // Content-Type header for indicating JSON response
        res.setHeader("Content-Type", "application/json");
        const sneakers = JSON.parse(data).items;

        // Adding slug to each sneaker object
        const sneakersWithSlug = sneakers.map(sneaker => ({
          ...sneaker,
          slug: generateSlug(sneaker.name) 
        }));

        res.json(sneakersWithSlug);
      });
    });

    request.on("error", function (error) {
      console.error("Request error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });

    request.end();
  } catch (error) {
    console.error("Error fetching sneakers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/sneaker/:slug/:id", async (req, res) => {
  const { slug, id } = req.params;
  try {
    // Ensuring that the slug is not undefined
    if (!slug) {
      return res.status(400).json({ error: 'Slug parameter is missing' });
    }

    // FetchING buildId
    const buildId = await fetchBuildId();

   
    const requestUrl = `https://www.sneakerjagers.com/_next/data/${buildId}/en/s/${slug}/${id}.json`;

    // Request to sneaker database API
    const response = await axios.get(requestUrl);

   //if response status is okay
    if (response.status === 200) {
      // Forwarding  JSON data to client
      res.json(response.data);
    } else {
      // if requested resource is not found
      res.status(response.status).json({ error: 'Requested resource not found' });
    }
  } catch (error) {
    console.error('Error fetching sneaker details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//RELEASE CALENDAR
app.get("/unreleased-sneakers", async (req, res) => {
  const page = req.query.page || 0;
  const perPage = req.query.perPage || 30;

  try {
    // Fetching buildId
    const buildId = await fetchBuildId();

    const releasesUrl = `https://www.sneakerjagers.com/_next/data/${buildId}/en/releases.json`;

    https.get(releasesUrl, function (response) {
      let data = "";

      response.on("data", function (chunk) {
        data += chunk;
      });

      response.on("end", function () {
        try {
          // Content-Type header to indicate JSON
          res.setHeader("Content-Type", "application/json");

          const releasesData = JSON.parse(data);

          if (!releasesData.pageProps || !releasesData.pageProps.items) {
            throw new Error("Invalid JSON structure: missing expected properties");
          }

          // Extracting the items object
          const items = releasesData.pageProps.items;

          // Filtering Unreleased sneakers and handling pagination
          const unreleasedSneakers = [];
          let count = 0;

          Object.values(items).forEach(release => {
            release.forEach(sneaker => {
              if (!sneaker.is_released) {
                count++;
                if (count > page * perPage && count <= (page + 1) * perPage) {
                  unreleasedSneakers.push({
                    ...sneaker,
                    slug: generateSlug(sneaker.name)
                  });
                }
              }
            });
          });

          res.json(unreleasedSneakers);
        } catch (error) {
          console.error("Error processing unreleased sneakers:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      });
    });

  } catch (error) {
    console.error("Error fetching unreleased sneakers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



//SNEAKER NIKEE ARIVALS
app.get('/nike-arrivals', (req, res) => {
  const countryCode = 'ca'; 
  const languageCode = 'en'; 

  const options = {
      "method": "GET",
      "hostname": "api.nike.com",
      "port": null,
      "path": `/cic/browse/v2?queryid=products&anonymousId=28E57711F3902AEA0342CEC70D3E5CDB&country=${countryCode}&endpoint=%2Fproduct_feed%2Frollup_threads%2Fv2%3Ffilter%3Dmarketplace(${countryCode})%26filter%3Dlanguage(${languageCode}-GB)%26filter%3DemployeePrice(true)%26filter%3DattributeIds(568f7ffc-ee7f-49ed-98eb-0b94708d6e88%2C16633190-45e5-4830-a068-232ac7aea82c%2C7baf216c-acc6-4452-9e07-39c2ca77ba32%2C53e430ba-a5de-4881-8015-68eb1cff459f%2C0f64ecc7-d624-4e91-b171-b83a03dd8550)%26anchor%3D72%26consumerChannelId%3Dd9a5bc42-4b9c-4976-858a-f159cf99c647%26count%3D24&language=${languageCode}-GB&localizedRangeStr=%7BlowestPrice%7D%E2%80%94%7BhighestPrice%7D`,
      "headers": {
          "cookie": "_abck=BD19ADB68EDAD6E9DAD87E1F7D5D999B~-1~YAAQyTbZF0vB4CyOAQAA9Cm6MQuMx9XyizgBnMCix1rhMocUmt987ydvBqetdb%2FzxPYnXdseUuB2lk0HbiH%2BUPCxZ8JItm79jj%2BZMgN2PauVm5EW7yIZ%2B7%2BZYZsECiYBFdtfdlCwn4m8pXPkmUL7arVGBV1fpuQ4jBTxW96z6dEH1wr6S%2FN700fWgsWK14DgcgN%2BD%2B%2BWwu3lkH7eHWACIIUYuU6rlndll6ei5puGp0OfdJAVwx5yy1DfGzYZgv1CjGrBogNyUOD1bcf0LiirUu7p58uLCLHPwYp5T4iiRkUtre7faXG4xO8LcH0tGAMWrtwICdNnniaVgsUufa6or%2FYJ0CKlBK8GkblKUlbN%2Fafv%2FI0L3xZmsg6Rz2XidT6UcDNb59Hksq0rMf3ThAZB62lK9afw2C7rUeXhysAd3EeOLHNk8R4Bkibij1I5bNdIY3A939Sxw7eWNEZfdO0KguPIHWb0UAimWLSAPvOjobaahDJoyA%3D%3D~-1~-1~-1",
          "User-Agent": "insomnia/8.6.1",
          "Content-Length": "0"
      }
  };
  

  const nikeRequest = https.request(options, function (apiRes) {
      let data = '';

      apiRes.on("data", function (chunk) {
          data += chunk;
      });

      apiRes.on("end", function () {
          const parsedData = JSON.parse(data);
          const products = parsedData.data.products.products.map(product => ({
              title: product.title,
              subtitle: '', 
              currency: product.price.currency,
              price: product.price.currentPrice,
              image: product.images.portraitURL,
              href: `https://www.nike.com/${countryCode}/${product.url.replace('{countryLang}', countryCode + '-' + languageCode)}`
          }));

          res.json(products);
      });
  });

  nikeRequest.end();
});


/// Function to generate a random JWT secret key
const crypto = require('crypto');

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secretKey = generateSecretKey();

//console.log("Secret key:", secretKey);



// Function to generate a unique user ID
const generateUserId = () => {
  // Generate a random string for the user ID
  return Math.random().toString(36).substr(2, 9);
};



//LOGIN&&SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Checking if user with provided email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creating a new user without specifying the _id field
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});





// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user with provided username exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);


    // Send the token to the client
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get token from Authorization header
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const userProfile = await User.findById(userId); 
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update User Email Endpoint
app.put("/profile/update-email", async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get token from Authorization header
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const { email } = req.body;

    await User.findByIdAndUpdate(userId, { email }); 
    res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating user email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update User Password Endpoint
app.put("/profile/update-password", async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get token from Authorization header
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const { password } = req.body;

    // Hash the new password before updating
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating user password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});






















































//FORUM
app.post("/forum/createThread", async (req, res) => {
  try {
      const newThread = new Thread({
        ...req.body
      });
      await newThread.save();
      res.status(201).json(newThread);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Retrieve All Threads
app.get("/forum/view", async (req, res) => {
  try {
      const threads = await Thread.find();
      res.status(200).json(threads);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Retrieve Single Thread by ID
app.get("/forum/view/:id", async (req, res) => {
  try {
      const thread = await Thread.findById(req.params.id);
      if (!thread) {
          return res.status(404).json({ message: "Thread not found" });
      }
      res.status(200).json(thread);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});
// Update Thread
app.put("/forum/updateThread/:id", async (req, res) => {
  try {
      // Retrieve the existing thread from the database
      const existingThread = await Thread.findById(req.params.id);
      if (!existingThread) {
          return res.status(404).json({ message: "Thread not found" });
      }

      // Merge the updated fields with the existing fields
      const updatedFields = { ...existingThread.toObject(), ...req.body };

      // Update the thread with the merged fields
      const updatedThread = await Thread.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
      if (!updatedThread) {
          return res.status(404).json({ message: "Thread not found" });
      }

      res.status(200).json(updatedThread);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});
//Add Like
app.put("/forum/addLike/:id", async (req, res) => {
  try {
      const thread = await Thread.findById(req.params.id);
      if (!thread) {
          return res.status(404).json({ message: "Thread not found" });
      }

      // Increment threadLikes by 1
      thread.threadLikes += 1;
      
      // Save the updated thread document
      const updatedThread = await thread.save();

      res.status(200).json(updatedThread);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});
app.put("/forum/deleteLike/:id", async (req, res) => {
  try {
      const thread = await Thread.findById(req.params.id);
      if (!thread) {
          return res.status(404).json({ message: "Thread not found" });
      }

      // Increment threadLikes by 1
      thread.threadLikes -= 1;
      
      // Save the updated thread document
      const updatedThread = await thread.save();

      res.status(200).json(updatedThread);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Delete Thread
app.delete("/forum/deleteThread/:id", async (req, res) => {
  try {
      const deletedThread = await Thread.findByIdAndDelete(req.params.id);
      if (!deletedThread) {
          return res.status(404).json({ message: "Thread not found" });
      }
      res.status(200).json({ message: "Thread deleted successfully" });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});





const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDb()
});
