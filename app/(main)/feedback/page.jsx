import FeedbackForm from "@/components/feedback-form";

export default function FeedbackPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-3xl font-bold">We Value Your Feedback</h1>
        <p className="text-muted-foreground">
          Let us know what you think about the platform. Your suggestions help us improve.
        </p>
      </div>

      {/* इथे तुमचा Feedback Form दिसेल */}
      <FeedbackForm />
    </div>
  );
}