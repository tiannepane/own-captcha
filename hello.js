import * as fs from 'fs';
import { withIronSessionApiRoute } from "iron-session/next";
import * as path from "path";

const carProbability = 0.5; // Probability that an image is a car

// Function to generate new CAPTCHA image paths
export function newCaptchaImages() {
  const images = [];
  for (let i = 0; i < 9; i++) {
    const shouldBeCar = Math.random() < carProbability; // Randomly decide if the image should be a car
    const number = Math.floor(Math.random() * (shouldBeCar ? 10 : 13)) + 1; // Get random number for the filename
    const filename = (shouldBeCar ? 'car' : 'bicycle') + number + '.png'; // Build filename
    const imagesDirectory = path.join(process.cwd(), 'public/cars-and-bicycles'); // Define directory path
    images.push(`${imagesDirectory}/${filename}`); // Add full path to the images array
  }
  return images; // Return the array of image paths
}

// API route to handle CAPTCHA image requests
export default withIronSessionApiRoute(async function handler(req, res) {
  const index = req.query.index; // Get the requested image index

  // Check if CAPTCHA images are already in the session
  if (!req.session.captchaImages) {
    req.session.captchaImages = newCaptchaImages(); // Generate new CAPTCHA images if not present
    await req.session.save(); // Save the session
  }

  // Validate the index parameter
  if (!index || index < 0 || index >= req.session.captchaImages.length) {
    res.status(400).send("Invalid index"); // Return error if index is invalid
    return;
  }

  try {
    const imagePath = req.session.captchaImages[index]; // Get the image path from the session
    const imageBuffer = fs.readFileSync(imagePath); // Read the image file
    res.setHeader('Content-Type', 'image/png'); // Set content type to PNG
    res.send(imageBuffer); // Send the image buffer as the response
  } catch (error) {
    console.error("Error reading CAPTCHA image:", error); // Log any errors
    res.status(500).send("Failed to load image"); // Return error response
  }
}, {
  cookieName: 'session', // Session cookie name
  password: process.env.SESSION_SECRET, // Secret key for session encryption
});
