"use server";

// Path change kele: "db" aivaji "prisma"
import { db } from "@/lib/prisma"; 
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function submitFeedback(formData) {
  try {
    const { userId: clerkUserId } = await auth();
    const message = formData.get("message");

    if (!message) {
      return { success: false, error: "Message is required" };
    }

    let userDbId = null;
    let userName = "Anonymous";
    
    if (clerkUserId) {
      // Ithe pan db waparla ahe, te automatic import mule chalu rahil
      const user = await db.user.findUnique({
        where: { clerkUserId },
        select: { id: true, name: true } 
      });
      
      if (user) {
        userDbId = user.id;
        userName = user.name || "User";
      }
    }

    await db.feedback.create({
      data: {
        message: message,
        name: userName,
        userId: userDbId,
      },
    });

    revalidatePath("/admin"); 
    return { success: true };
    
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return { success: false, error: "Database Error: " + error.message };
  }
}