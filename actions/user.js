"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    // ---------------------------------------------------------
    // STEP 1: Prepare Data (Outside Transaction)
    // We check if we need AI insights BEFORE locking the database
    // ---------------------------------------------------------
    const industryInsightConfig = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    let aiInsights;
    
    // Only call the slow AI if the industry doesn't exist
    if (!industryInsightConfig) {
      aiInsights = await generateAIInsights(data.industry);
    }

    // ---------------------------------------------------------
    // STEP 2: Database Transaction (Fast Writes Only)
    // ---------------------------------------------------------
    const result = await db.$transaction(
      async (tx) => {
        // Check if industry exists (again, for safety within transaction)
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        // If it still doesn't exist, create it using the PRE-GENERATED AI data
        if (!industryInsight) {
            // Note: If multiple users hit this at the exact same time,
            // one might fail here if we don't have aiInsights ready. 
            // But in your flow, if !industryInsightConfig, we generated aiInsights.
            
          if (aiInsights) {
             industryInsight = await tx.industryInsight.create({
              data: {
                industry: data.industry,
                ...aiInsights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          } else {
            // Fallback: If we are here, it means the industry existed in Step 1,
            // but was deleted before Step 2 (very rare). 
            // Or, the user is switching to an industry that was JUST created by someone else.
            // In that case, we fetch it again.
             industryInsight = await tx.industryInsight.findUnique({
                where: { industry: data.industry },
             });
          }
        }

        // Now update the user
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight };
      },
      {
        timeout: 10000, // You likely won't hit this anymore
      }
    );

    return { success: true, ...result };
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile " + error.message);
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
    throw new Error("Failed to check onboarding status");
  }
}