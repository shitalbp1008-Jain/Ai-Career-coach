import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";

export const metadata = {
  title: "Resume Builder",
  description: "Create and export your professional resume with AI assistance",
};

export default async function ResumePage() {
  const resume = await getResume();

  return (
    <div className="container mx-auto py-6">
      {/* Pass resume.content. If it's null (new user), pass an empty string 
         to avoid undefined errors in the editor.
      */}
      <ResumeBuilder initialContent={resume?.content || ""} />
    </div>
  );
}