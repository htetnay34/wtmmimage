import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [translatedPrompt, setTranslatedPrompt] = useState("");

  const translatePrompt = async (prompt) => {
    const queryParams = new URLSearchParams({
      q: prompt,
      langpair: "my|en", // Translation from Myanmar to English
    });

    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?${queryParams}`);
      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        setTranslatedPrompt(data.responseData.translatedText);
      } else {
        throw new Error("Translation failed");
      }
    } catch (translationError) {
      console.error("Error translating prompt:", translationError);
      setError("Error translating prompt");
    }
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous translated prompt and error
    setTranslatedPrompt("");
    setError(null);

    try {
      // Ensure the translated prompt is available before making the API call
      await translatePrompt(e.target.prompt.value);

    
// You can use `translatedPrompt` in the API call
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: translatedPrompt, // Use the translated prompt
        }),
      });




      
    let prediction = await response.json();
     if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        return;
      }
      console.log({ prediction });
      setPrediction(prediction);
    }
  };

 const handleDownload = async () => {
    // Check if there is an image URL to download
    if (prediction && prediction.output && prediction.output.length > 0) {
      try {
        // Fetch the image data
        const response = await fetch(prediction.output[prediction.output.length - 1]);
        const blob = await response.blob();

        // Create a link element
        const link = document.createElement("a");
        // Create a Blob URL for the image data
        const url = window.URL.createObjectURL(blob);
        
        // Set the href attribute to the Blob URL
        link.href = url;
        // Set the download attribute to specify the file name
        link.download = "generated_image.png";
        // Append the link to the document body
        document.body.appendChild(link);
        // Trigger a click event on the link to start the download
        link.click();
        // Remove the link from the document body
        document.body.removeChild(link);

        // Revoke the Blob URL to free up resources
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
  };

  

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Replicate + Next.js</title>
      </Head>

      <h1 className="py-6 text-center font-bold text-2xl">
        Dream something with{" "}
        <a href="https://replicate.com/stability-ai/sdxl?utm_source=project&utm_project=getting-started">
          SDXL
        </a>
      </h1>

      <form className="w-full flex" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Enter a prompt to display an image"
        />
        <button className="button" type="submit">
          Go!
        </button>
      </form>

      {error && <div>{error}</div>}
       
        {/* Display translated prompt */}
      {translatedPrompt && (
        <p className="py-3 text-sm opacity-50">Translated prompt: {translatedPrompt}</p>
      )}
       

      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper mt-5">
              <Image
                fill
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                sizes="100vw"
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>


          {/* Add the download button */}
          <button
            className="button mt-3"
            onClick={handleDownload}
            disabled={!prediction.output || prediction.output.length === 0}
          >
            Download Image
          </button>
            
        </>
      )}
    </div>
  );
}
