"use client";

import { useState } from "react";
import { submitFeedback } from "@/actions/feedback";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function FeedbackForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("message", message);

    try {
      const result = await submitFeedback(formData);

      if (result.success) {
        toast.success("Feedback submitted successfully!");
        setMessage("");
      } else {
        toast.error(result.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4 p-6 bg-white rounded-lg border shadow-sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Your Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your feedback here..."
          // खालील Class मध्ये 'text-black' ॲड केला आहे
          className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black bg-white"
          required
        />
        
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Feedback
        </button>
      </form>
    </div>
  );
}