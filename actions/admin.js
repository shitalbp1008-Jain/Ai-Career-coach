"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// 🚨 SECURITY: REPLACE THIS WITH YOUR REAL EMAIL ADDRESS
const ADMIN_EMAIL = "shitalpatil26102020@gmail.com"; 

// ✅ HELPER FUNCTION: Check if user is admin gracefully
export async function checkAdmin() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  if (!user || email !== ADMIN_EMAIL) {
    // ❌ Error throw करण्याऐवजी ऑब्जेक्ट return करत आहोत
    return { 
      success: false, 
      message: "⛔ Unauthorized: Access restricted to Administrators only." 
    };
  }
  
  return { success: true, user };
}

// ==========================================
// 1. DASHBOARD OVERVIEW STATS
// ==========================================
export async function getAdminStats() {
  const auth = await checkAdmin();
  if (!auth.success) return auth; // 🛑 Stop if not admin

  const [totalUsers, totalResumes, totalCoverLetters, totalAssessments] = await Promise.all([
    db.user.count(),
    db.resume.count(),
    db.coverLetter.count(),
    db.assessment.count(),
  ]);

  return { 
    success: true,
    totalUsers, 
    totalResumes, 
    totalCoverLetters, 
    totalAssessments,
  };
}

// ==========================================
// 2. USER MANAGEMENT (READ)
// ==========================================
export async function getUserActivity() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          coverLetter: true,
          assessments: true,
        },
      },
      resume: {
        select: { id: true, updatedAt: true }
      },
      assessments: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { quizScore: true }
      }
    },
  });

  const formattedUsers = users.map((user) => ({
    ...user,
    _count: {
      ...user._count,
      resume: user.resume ? 1 : 0, 
    },
  }));

  return { success: true, data: formattedUsers };
}

// ==========================================
// 3. DELETE OPERATION
// ==========================================
export async function deleteUser(userId) {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  try {
    await db.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin");
    return { success: true, message: "User deleted successfully." };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, message: "Failed to delete user." };
  }
}

// ==========================================
// 4. UPDATE OPERATION
// ==========================================
export async function updateUser(userId, data) {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        industry: data.industry, 
        bio: data.bio,
      },
    });

    revalidatePath("/admin");
    return { success: true, message: "User updated successfully." };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Failed to update user." };
  }
}

// ==========================================
// 5. USER EXPORT DATA (Master User Report)
// ==========================================
export async function getDataForExport() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { coverLetter: true, assessments: true } },
      resume: { select: { id: true } },
      assessments: { take: 1, orderBy: { createdAt: "desc" }, select: { quizScore: true } }
    },
  });

  const data = users.map((user) => ({
    Name: user.name || "N/A",
    Email: user.email,
    Industry: user.industry || "N/A",
    "Total Resumes": user.resume ? 1 : 0,
    "Total Cover Letters": user._count.coverLetter,
    "Latest Quiz Score": user.assessments[0]?.quizScore?.toFixed(1) || "N/A",
    "Joined Date": user.createdAt.toLocaleDateString(),
  }));

  return { success: true, data };
}

// ==========================================
// 6. INDUSTRY INSIGHTS (Dashboard View)
// ==========================================
export async function getIndustryStats() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;
  
  const stats = await db.industryInsight.findMany({
    orderBy: { lastUpdated: "desc" },
    include: {
      _count: {
        select: { users: true } 
      }
    }
  });

  return { success: true, data: stats };
}

// ==========================================
// 7. RECENT ACTIVITY LOGS (Dashboard View)
// ==========================================
export async function getRecentActivityLog() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const assessments = await db.assessment.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { 
      user: { select: { name: true, email: true, imageUrl: true } } 
    }
  });

  const coverLetters = await db.coverLetter.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { 
      user: { select: { name: true, email: true, imageUrl: true } } 
    }
  });

  return { success: true, assessments, coverLetters };
}

// ==========================================
// 8. INDUSTRY EXPORT DATA (Report #2)
// ==========================================
export async function getIndustryDataForExport() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const industries = await db.industryInsight.findMany({
    orderBy: { lastUpdated: "desc" },
    include: {
      _count: { select: { users: true } }
    }
  });

  const data = industries.map((ind) => ({
    Industry: ind.industry,
    "Total Users": ind._count.users,
    "Growth Rate": `${ind.growthRate}%`,
    "Top Skills": ind.topSkills.join(", "), 
    "Last Updated": ind.lastUpdated.toLocaleDateString(),
  }));

  return { success: true, data };
}

// ==========================================
// 9. QUIZ EXPORT DATA (Report #3)
// ==========================================
export async function getQuizDataForExport() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;
  
  const assessments = await db.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } }
    }
  });
  
  const data = assessments.map(q => ({
    "User Name": q.user.name || "Anonymous",
    "Email": q.user.email,
    "Quiz Category": q.category,
    "Score": `${q.quizScore.toFixed(1)}%`,
    "Result": q.quizScore >= 70 ? "Passed" : "Failed",
    "Date Taken": q.createdAt.toLocaleDateString(),
  }));

  return { success: true, data };
}

// ==========================================
// 10. COVER LETTER EXPORT DATA (Helper for Report #3)
// ==========================================
export async function getCoverLetterDataForExport() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;
  
  const letters = await db.coverLetter.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } }
    }
  });
  
  const data = letters.map(cl => ({
    "User Name": cl.user.name || "Anonymous",
    "Email": cl.user.email,
    "Job Title": cl.jobTitle,
    "Company": cl.companyName,
    "Date Created": cl.createdAt.toLocaleDateString(),
  }));

  return { success: true, data };
}

// ==========================================
// 11. NEW: TOP PERFORMERS (Report #4)
// ==========================================
export async function getTopPerformers() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const users = await db.user.findMany({
    where: {
      assessments: {
        some: { quizScore: { gte: 80 } }
      }
    },
    include: {
      assessments: {
        orderBy: { quizScore: "desc" },
        take: 1
      },
      resume: { select: { id: true } }
    }
  });

  const data = users.map(u => ({
    "Name": u.name,
    "Email": u.email,
    "Top Score": `${u.assessments[0]?.quizScore.toFixed(0)}%` || "N/A",
    "Has Resume": u.resume ? "Yes" : "No",
    "Industry": u.industry || "N/A"
  }));

  return { success: true, data };
}

// ==========================================
// 12. NEW: TARGET COMPANIES (Report #5)
// ==========================================
export async function getTargetCompanies() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const letters = await db.coverLetter.findMany({
    orderBy: { createdAt: "desc" },
    select: { companyName: true, jobTitle: true, createdAt: true }
  });

  const data = letters.map(l => ({
    "Company Name": l.companyName,
    "Job Applied For": l.jobTitle,
    "Date": l.createdAt.toLocaleDateString()
  }));

  return { success: true, data };
}

// ==========================================
// 13. NEW: AT-RISK USERS (Report #6)
// ==========================================
export async function getAtRiskUsers() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const users = await db.user.findMany({
    where: {
      resume: null, // No resume
      assessments: { none: {} } // No quizzes taken
    },
    orderBy: { createdAt: "desc" }
  });

  const data = users.map(u => ({
    "Name": u.name,
    "Email": u.email,
    "Joined": u.createdAt.toLocaleDateString(),
    "Status": "Inactive / No Data"
  }));

  return { success: true, data };
}

// ==========================================
// 14. NEW: MONTHLY GROWTH (Report #7)
// ==========================================
export async function getMonthlyGrowth() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const users = await db.user.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    orderBy: { createdAt: "desc" }
  });

  const data = users.map(u => ({
    "Name": u.name,
    "Email": u.email,
    "Joined Date": u.createdAt.toLocaleDateString(),
    "Industry": u.industry || "Unspecified"
  }));

  return { success: true, data };
}

// ==========================================
// 15. NEW: LOW SCORES (Report #8)
// ==========================================
export async function getLowScorers() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const assessments = await db.assessment.findMany({
    where: { quizScore: { lt: 60 } },
    orderBy: { quizScore: "asc" },
    include: { user: { select: { name: true, email: true } } }
  });

  const data = assessments.map(q => ({
    "Name": q.user.name,
    "Email": q.user.email,
    "Low Score": `${q.quizScore.toFixed(0)}%`,
    "Topic": q.category,
    "Date Taken": q.createdAt.toLocaleDateString()
  }));

  return { success: true, data };
}

// ==========================================
// 16. NEW: POWER USERS (Report #9)
// ==========================================
export async function getPowerUsers() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const users = await db.user.findMany({
    where: {
      resume: { isNot: null },
      coverLetter: { some: {} }
    },
    include: {
      _count: { select: { coverLetter: true } }
    }
  });

  const data = users.map(u => ({
    "Name": u.name,
    "Email": u.email,
    "Status": "Elite User",
    "Cover Letters Created": u._count.coverLetter,
    "Joined": u.createdAt.toLocaleDateString()
  }));

  return { success: true, data };
}

// ==========================================
// 17. NEW: RESUME FRESHNESS (Report #10)
// ==========================================
export async function getResumeStatus() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  const resumes = await db.resume.findMany({
    orderBy: { updatedAt: "asc" }, // Oldest first
    include: { user: { select: { name: true, email: true } } }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const data = resumes.map(r => ({
    "User Name": r.user.name,
    "Last Updated": r.updatedAt.toLocaleDateString(),
    "Status": r.updatedAt < thirtyDaysAgo ? "Stale (>30 Days)" : "Fresh",
    "Resume ID": r.id
  }));

  return { success: true, data };
}

// ==========================================
// 18. NEW: VISUAL REPORTS AGGREGATION (For Charts)
// ==========================================
export async function getVisualReportsData() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  // --- A. Monthly Growth Data (Bar Chart) ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsers = await db.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  });

  const growthMap = {};
  newUsers.forEach(u => {
    // Format: "21 Nov"
    const dateKey = u.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    growthMap[dateKey] = (growthMap[dateKey] || 0) + 1;
  });

  // Convert to Array for Recharts
  const growthChartData = Object.entries(growthMap).map(([date, count]) => ({
    name: date,
    users: count
  })).sort((a, b) => new Date(a.name) - new Date(b.name));


  // --- B. Industry Distribution (Pie Chart) ---
  const industryGroups = await db.user.groupBy({
    by: ['industry'],
    _count: { industry: true },
  });

  const industryPieData = industryGroups
    .map(g => ({ name: g.industry || "Unspecified", value: g._count.industry }))
    .filter(i => i.value > 0);


  // --- C. Skill Gap Analysis (Pass vs Fail Pie Chart) ---
  const assessments = await db.assessment.findMany({ select: { quizScore: true } });
  const passed = assessments.filter(a => a.quizScore >= 70).length;
  const failed = assessments.length - passed;

  const quizPieData = [
    { name: "Passed (>70%)", value: passed, fill: "#10b981" }, // Green
    { name: "Needs Improvement", value: failed, fill: "#ef4444" } // Red
  ];


  // --- D. Resume Freshness (Pie Chart) ---
  const freshResumes = await db.resume.count({ where: { updatedAt: { gte: thirtyDaysAgo } } });
  const staleResumes = await db.resume.count({ where: { updatedAt: { lt: thirtyDaysAgo } } });
  
  const resumePieData = [
    { name: "Fresh (<30 Days)", value: freshResumes, fill: "#3b82f6" }, // Blue
    { name: "Stale (>30 Days)", value: staleResumes, fill: "#f59e0b" } // Orange
  ];

  // --- E. NEW: Top Running Industry Insights (Bar Chart) ---
  const topTrending = await db.industryInsight.findMany({
    take: 5,
    orderBy: { growthRate: 'desc' }, // Highest growth first
    select: { industry: true, growthRate: true, demandLevel: true }
  });

  const topIndustryData = topTrending.map(ind => ({
    name: ind.industry,
    growth: ind.growthRate, // This will be the bar height
    demand: ind.demandLevel // Extra info for tooltips
  }));

  return {
    success: true,
    growthChartData,
    industryPieData,
    quizPieData,
    resumePieData,
    topIndustryData 
  };
}

// ==========================================
// 19. USER FEEDBACK (READ)
// ==========================================
export async function getFeedbacks() {
  const auth = await checkAdmin();
  if (!auth.success) return auth;

  try {
    const feedbacks = await db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    return { success: true, data: feedbacks };
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return { success: false, message: "Error fetching feedbacks" };
  }
}