import Captcha from "../components/Captcha";
import { useState } from "react";
import { withIronSessionSsr } from "iron-session/next";
import { newCaptchaImages } from "./api/captcha-image";

export default function Home({ defaultCaptchaKey }) {
    // State to hold the user's message
    const [message, setMessage] = useState("");
    // State to hold the indexes of selected CAPTCHA images
    const [selectedIndexes, setSelectedIndexes] = useState([]);
    // State to hold the key for refreshing the CAPTCHA
    const [captchaKey, setCaptchaKey] = useState(defaultCaptchaKey);

    // Function to handle message submission
    function send() {
        // Check if the message is empty
        if (!message) {
            alert("The message is required");
            return;
        }

        // Send the message and selected CAPTCHA indexes to the server
        fetch("/api/send", {
            method: "POST",
            body: JSON.stringify({
                message: message, // The message entered by the user
                selectedIndexes: selectedIndexes // The CAPTCHA indexes selected by the user
            }),
            headers: {
                "Content-Type": "application/json" // Set the content type for the request
            }
        })
            .then((response) => response.json()) // Parse the JSON response from the server
            .then((json) => {
                // Handle successful message submission
                if (json.sent) {
                    setCaptchaKey(Date.now()); // Refresh the CAPTCHA key
                    alert("Message sent"); // Notify the user
                    setMessage(""); // Clear the message input
                } else if (!json.captchaIsOk) {
                    // Handle incorrect CAPTCHA
                    setCaptchaKey(Date.now()); // Refresh the CAPTCHA key
                    alert("Wrong CAPTCHA. Try again."); // Notify the user
                }
            })
            .catch((error) => {
                // Handle errors during the fetch operation
                console.error("Error sending message:", error);
                alert("An error occurred. Please try again.");
            });
    }

    return (
        <main>
            {/* Input field for the user to enter their message */}
            <input
                type="text"
                onChange={(e) => setMessage(e.target.value)} // Update the message state on change
                placeholder="Message" // Placeholder text for the input field
                value={message} // Bind the input value to the message state
            />
            <div>
                {/* CAPTCHA component to verify the user is human */}
                <Captcha captchaKey={captchaKey} onChange={setSelectedIndexes} />
            </div>
            {/* Button to send the message */}
            <button onClick={send}>Send</button>
        </main>
    );
}

export const getServerSideProps = withIronSessionSsr(
    async ({ req }) => {
        // Check if CAPTCHA images are stored in the session
        if (!req.session.captchaImages) {
            req.session.captchaImages = newCaptchaImages(); // Generate new CAPTCHA images
            await req.session.save(); // Save the session
        }

        // Pass the default CAPTCHA key as a prop to the component
        return {
            props: {
                defaultCaptchaKey: Date.now() // Generate a default CAPTCHA key based on the current timestamp
            }
        };
    },
    {
        cookieName: "session", // Name of the session cookie
        password: process.env.SESSION_SECRET // Secret key for encrypting the session
    }
);
