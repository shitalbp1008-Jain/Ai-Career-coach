"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { 
  Loader2, Users, FileText, Briefcase, TrendingUp, 
  CheckCircle, XCircle, RefreshCw, Trash2, Pencil, Download, 
  FileSpreadsheet, AlertTriangle, Building, UserCheck, Clock, Star, AlertOctagon,
  PieChart as PieChartIcon, BarChart3, Rocket, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

import { 
  getAdminStats, 
  getIndustryStats, 
  getRecentActivityLog, 
  getUserActivity, 
  deleteUser, 
  updateUser,
  getDataForExport,            
  getIndustryDataForExport,    
  getQuizDataForExport,        
  getTopPerformers,            
  getTargetCompanies,          
  getAtRiskUsers,              
  getMonthlyGrowth,            
  getLowScorers,               
  getPowerUsers,               
  getResumeStatus,
  getVisualReportsData,
  getFeedbacks
} from "@/actions/admin";

// ✅ NEW: Constant for Company Address
const COMPANY_ADDRESS = "Registered Office Address: 210, E Ward, New Shahupuri, Kolhapur, Maharashtra - 416001.";

// ✅ NEW: Helper function to convert image URL to Base64 for PDF
const getBase64ImageFromURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/logo1.jpg");
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalResumes: 0, totalCoverLetters: 0, totalAssessments: 0 });
  const [users, setUsers] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]); 
  const [recentLog, setRecentLog] = useState({ assessments: [], coverLetters: [] });
  const [visuals, setVisuals] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [activeTab, setActiveTab] = useState("users");
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ industry: "", bio: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, industriesRes, logRes, visualRes, feedbackRes] = await Promise.all([
        getAdminStats(),
        getUserActivity(),
        getIndustryStats(),
        getRecentActivityLog(),
        getVisualReportsData(),
        getFeedbacks() 
      ]);
      
      if (statsRes.success) setStats(statsRes);
      if (usersRes.success) setUsers(usersRes.data);
      if (industriesRes.success) setIndustries(industriesRes.data);
      if (logRes.success) setRecentLog({ assessments: logRes.assessments, coverLetters: logRes.coverLetters });
      if (visualRes.success) setVisuals(visualRes);
      if (feedbackRes.success) setFeedbacks(feedbackRes.data);
      
      if (!statsRes.success) {
         toast.error(statsRes.message || "Access Denied");
      }

    } catch (error) {
      console.error("Admin Error:", error);
      toast.error("Something went wrong while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success("User deleted successfully");
        loadData(); 
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({ industry: user.industry || "", bio: user.bio || "" });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const result = await updateUser(editingUser.id, editFormData);
      if (result.success) {
        toast.success("User updated successfully");
        setEditingUser(null);
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  // ============================================================
  // 📄 UPDATED PDF GENERATOR (With Logo & Address)
  // ============================================================
  const generatePDF = async (title, data) => {
    if (!data || data.length === 0) {
      toast.error("No data available for this report.");
      return;
    }

    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    try {
      // 1. Load Logo (Ensure logo1.jpg is in /public folder)
      const logoUrl = "/logo1.jpg"; 
      try {
        const logoBase64 = await getBase64ImageFromURL(logoUrl);
        // doc.addImage(image, format, x, y, width, height)
        // Dimensions set for a wide logo
        doc.addImage(logoBase64, 'JPEG', 14, 10, 50, 15); 
      } catch (err) {
        console.warn("Logo could not be loaded", err);
      }

      // 2. Add Company Address (Gray text under logo)
      doc.setFontSize(8);
      doc.setTextColor(100); 
      doc.text(COMPANY_ADDRESS, 14, 32);

      // 3. Draw Header Divider Line
      doc.setDrawColor(200); 
      doc.line(14, 36, 196, 36);

      // 4. Report Title & Meta Data
      doc.setTextColor(0); // Reset to black
      doc.setFontSize(16);
      doc.text(title, 14, 48); // Moved down to fit header

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${dateStr}`, 14, 55);
      doc.text(`Total Records: ${data.length}`, 14, 60);

      // 5. Generate Table
      const tableBody = data.map(item => Object.values(item).map(val => {
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val;
      }));

      autoTable(doc, {
        head: [Object.keys(data[0])],
        body: tableBody,
        startY: 65, // Start table lower to prevent overlap
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 163, 74] }, // Keep Green Header
        didDrawPage: (data) => {
            // Footer
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("AI Career Coach - Confidential Report", 14, pageHeight - 10);
        }
      });

      // 6. Save File
      doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      toast.success(`${title} Generated`);

    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF layout.");
    }
  };

  const handleDownloadReport = async (reportType) => {
    setIsExporting(true);
    try {
      let response = { success: false, data: [] }; 
      let title = "";

      switch (reportType) {
        case "users":
          response = await getDataForExport();
          title = "Master User Activity Report";
          break;
        case "feedbacks": 
          response = { success: true, data: feedbacks.map(f => ({
            Date: new Date(f.createdAt).toLocaleDateString(),
            User: f.name || "Anonymous",
            Email: f.user?.email || "Guest",
            Message: f.message
          }))};
          title = "User Feedback Report";
          break;
        case "top-trends": 
          response = await getIndustryDataForExport(); 
          title = "Top Running Industry Insights";
          break;
        case "industry":
          response = await getIndustryDataForExport();
          title = "Industry Insights Report";
          break;
        case "quiz":
          response = await getQuizDataForExport();
          title = "Quiz Performance Report";
          break;
        case "top-talent":
          response = await getTopPerformers();
          title = "Top Talent Candidates";
          break;
        case "companies":
          response = await getTargetCompanies();
          title = "Target Companies Report";
          break;
        case "at-risk":
          response = await getAtRiskUsers();
          title = "At-Risk Inactive Users";
          break;
        case "growth":
          response = await getMonthlyGrowth();
          title = "Monthly User Growth";
          break;
        case "low-score":
          response = await getLowScorers();
          title = "Skill Gap Analysis (Low Scores)";
          break;
        case "power-users":
          response = await getPowerUsers();
          title = "Elite Power Users";
          break;
        case "resume-freshness":
          response = await getResumeStatus();
          title = "Resume Freshness Report";
          break;
      }
      
      if (response.success) {
        await generatePDF(title, response.data);
      } else {
        toast.error(response.message || "Failed to fetch report data");
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefreshIndustry = async (industryName) => {
    setRefreshingId(industryName);
    try {
      const result = await getIndustryStats();
      if(result.success) {
        setIndustries(result.data);
        toast.success(`Refreshed data for ${industryName}`);
      } else {
        toast.error("Failed to refresh");
      }
    } catch (error) {
      toast.error("Failed to refresh industry data");
    } finally {
      setRefreshingId(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="text-sm md:text-base text-muted-foreground">System-wide metrics and user management.</p>
        </div>
      </div>

      {/* DASHBOARD STATS - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Resumes Created" value={stats.totalResumes} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Quizzes Taken" value={stats.totalAssessments} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="User Feedbacks" value={feedbacks.length} icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* RESPONSIVE TABS LIST: Scrollable on mobile */}
        <div className="w-full overflow-x-auto pb-2">
            <TabsList className="w-auto flex justify-start h-auto p-1">
            <TabsTrigger value="users">User Activity</TabsTrigger>
            <TabsTrigger value="feedbacks" className="gap-2"><MessageSquare className="h-3 w-3"/> Feedbacks</TabsTrigger> 
            <TabsTrigger value="industries">Industry Insights</TabsTrigger>
            <TabsTrigger value="recent">Recent Logs</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Reports Center</TabsTrigger>
            </TabsList>
        </div>

        {/* 1. USERS TAB */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>User Activity Report</CardTitle>
                <CardDescription>Manage users and view their system usage.</CardDescription>
              </div>
              <Button onClick={() => handleDownloadReport("users")} disabled={isExporting} className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </CardHeader>
            <CardContent>
              {/* RESPONSIVE TABLE WRAPPER */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-4 font-medium min-w-[200px]">User</th>
                      <th className="p-4 font-medium min-w-[150px]">Industry</th>
                      <th className="p-4 font-medium text-center">Resume</th>
                      <th className="p-4 font-medium text-center">Quiz</th>
                      <th className="p-4 font-medium text-right">Score</th>
                      <th className="p-4 font-medium text-right min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          {user.imageUrl ? <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full" /> : <div className="h-8 w-8 rounded-full bg-gray-200" />}
                          <div>
                            <div className="font-medium">{user.name || "Guest"}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4 max-w-[150px] truncate">{user.industry || <span className="text-muted-foreground italic text-xs">Not Onboarded</span>}</td>
                        <td className="p-4 text-center">
                          {user._count.resume > 0 ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-gray-300 mx-auto" />}
                        </td>
                        <td className="p-4 text-center"><Badge variant="secondary">{user._count.assessments}</Badge></td>
                        <td className="p-4 text-right">
                          {user.assessments[0] ? (
                            <span className={`font-bold ${user.assessments[0].quizScore >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                              {user.assessments[0].quizScore.toFixed(0)}%
                            </span>
                          ) : "-"}
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(user)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. FEEDBACKS TAB */}
        <TabsContent value="feedbacks">
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>User Feedback</CardTitle>
                        <CardDescription>Read suggestions and issues reported by users.</CardDescription>
                    </div>
                    <Button onClick={() => handleDownloadReport("feedbacks")} disabled={isExporting} variant="outline" className="w-full md:w-auto">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                </CardHeader>
                <CardContent>
                    {feedbacks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No feedback received yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {feedbacks.map((fb) => (
                                <div key={fb.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{fb.name || "Anonymous"}</span>
                                            {fb.user?.email && (
                                                <Badge variant="secondary" className="text-xs max-w-[200px] truncate">{fb.user.email}</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm bg-muted/30 p-3 rounded-md border border-muted">
                                        {fb.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* 3. INDUSTRIES TAB */}
        <TabsContent value="industries">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind) => (
              <Card key={ind.id} className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">{ind.industry}</CardTitle>
                    <Badge>{ind._count.users} Users</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Growth: <span className={ind.growthRate > 0 ? "text-green-600" : "text-red-600"}>{ind.growthRate}%</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Top Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {ind.topSkills.slice(0, 3).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-xs text-muted-foreground">Updated: {new Date(ind.lastUpdated).toLocaleDateString()}</div>
                    <Button variant="outline" size="sm" onClick={() => handleRefreshIndustry(ind.industry)} disabled={refreshingId === ind.industry}>
                      {refreshingId === ind.industry ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />} Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. RECENT LOGS TAB */}
        <TabsContent value="recent">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Recent Quiz Results</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLog.assessments.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 min-w-[2rem] rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">{quiz.quizScore.toFixed(0)}</div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{quiz.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{quiz.category}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Recent Cover Letters</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLog.coverLetters.map((cl) => (
                    <div key={cl.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{cl.jobTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">{cl.companyName}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{new Date(cl.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. REPORTS CENTER TAB */}
        <TabsContent value="reports" className="space-y-8">
            
            {/* --- VISUALS SECTION --- */}
            {visuals && (
                <div className="space-y-6">
                    
                    {/* TOP TRENDING INDUSTRIES CHART */}
                    <Card id="chart-top-trends" className="border-blue-100 bg-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                                <Rocket className="h-5 w-5 text-blue-600" /> 
                                Top Running Industry Insights (AI Growth)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={visuals.topIndustryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                    <CartesianGrid stroke="#4A5568" strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" unit="%" fontSize={12} stroke="#E2E8F0" tick={{ fill: "#64748b" }} />
                                    <YAxis dataKey="name" type="category" width={100} fontSize={11} stroke="#E2E8F0" tick={{ fill: "#64748b" }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', borderColor: '#e2e8f0' }} />
                                    <Bar dataKey="growth" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Growth Rate %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Growth Chart */}
                        <Card id="chart-growth">
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4"/> Monthly User Growth</CardTitle></CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visuals.growthChartData}>
                                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
                                        <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Skill Gap Chart */}
                        <Card id="chart-gap">
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="h-4 w-4"/> Skill Gap Analysis</CardTitle></CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={visuals.quizPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {visuals.quizPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Hidden Charts for PDF capture (kept hidden) */}
                        <Card id="chart-resume" className="hidden">
                             <CardContent className="h-[300px] w-[600px] bg-white">
                                <h2 className="text-xl font-bold mb-4">Resume Freshness Status</h2>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={visuals.resumePieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                                            {visuals.resumePieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

          <Card>
            <CardHeader>
              <CardTitle>Download Reports</CardTitle>
              <CardDescription>Generate PDF reports with visuals and data tables.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ReportCard title="Master User Report" desc="Complete list of all users and their status." icon={<Users className="h-5 w-5 text-blue-500" />} onClick={() => handleDownloadReport("users")} isLoading={isExporting} />
                <ReportCard title="User Feedback" desc="Export all user feedback." icon={<MessageSquare className="h-5 w-5 text-pink-500" />} onClick={() => handleDownloadReport("feedbacks")} isLoading={isExporting} />
                <ReportCard title="Top Running Industry Insights" desc="Includes Top Trending Chart." icon={<TrendingUp className="h-5 w-5 text-green-500" />} onClick={() => handleDownloadReport("top-trends")} isLoading={isExporting} />
                <ReportCard title="Quiz Performance Report" desc="Detailed logs of all quiz attempts." icon={<CheckCircle className="h-5 w-5 text-purple-500" />} onClick={() => handleDownloadReport("quiz")} isLoading={isExporting} />
                <ReportCard title="Top Talent (Job Ready)" desc="Candidates with quiz scores > 80%." icon={<UserCheck className="h-5 w-5 text-yellow-500" />} onClick={() => handleDownloadReport("top-talent")} isLoading={isExporting} />
                <ReportCard title="Skill Gap Analysis" desc="Includes Pass vs Fail Visual Chart." icon={<AlertOctagon className="h-5 w-5 text-red-500" />} onClick={() => handleDownloadReport("low-score")} isLoading={isExporting} />
                <ReportCard title="Elite Power Users" desc="Users with both Resume & Cover Letter." icon={<Star className="h-5 w-5 text-indigo-500" />} onClick={() => handleDownloadReport("power-users")} isLoading={isExporting} />
                <ReportCard title="Target Companies" desc="Where are users applying?" icon={<Building className="h-5 w-5 text-gray-500" />} onClick={() => handleDownloadReport("companies")} isLoading={isExporting} />
                <ReportCard title="Resume Freshness" desc="Includes Freshness Pie Chart." icon={<Clock className="h-5 w-5 text-teal-500" />} onClick={() => handleDownloadReport("resume-freshness")} isLoading={isExporting} />
                <ReportCard title="At-Risk Inactive Users" desc="Users with no resume or activity." icon={<AlertTriangle className="h-5 w-5 text-orange-500" />} onClick={() => handleDownloadReport("at-risk")} isLoading={isExporting} />
                <ReportCard title="Monthly User Growth" desc="Includes User Signup Bar Chart." icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} onClick={() => handleDownloadReport("growth")} isLoading={isExporting} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white text-slate-900 shadow-2xl border border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 font-bold">Edit User: {editingUser.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label className="text-slate-800 font-semibold">Industry</Label>
                <Input 
                  className="bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-slate-400"
                  value={editFormData.industry} 
                  onChange={(e) => setEditFormData({...editFormData, industry: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-800 font-semibold">Bio</Label>
                <Input 
                  className="bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-slate-400"
                  value={editFormData.bio} 
                  onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button 
                    variant="outline" 
                    className="text-slate-700 border-slate-300 hover:bg-slate-100" 
                    onClick={() => setEditingUser(null)}
                >
                    Cancel
                </Button>
                <Button onClick={handleSaveUser}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, desc, icon, onClick, isLoading }) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{desc}</p>
        <Button variant="secondary" size="sm" className="w-full" disabled={isLoading}>
          {isLoading ? "Generating..." : "Download PDF"}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatsCard({ title, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}