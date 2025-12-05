"use client";

import React, { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

export const ResumePDF = ({ data }) => {
  const [loading, setLoading] = useState(false);

  const generatePDF = () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageHeight = 297; 
      let yPos = 0;

      // --- BALANCED SETTINGS (मोकळी जागा भरण्यासाठी) ---
      const MARGIN_LEFT = 15;     // मार्जिन 14 वरून 15 केले
      const TEXT_WIDTH = 180;     
      const LINE_HEIGHT = 5;      // ओळींमधील अंतर 4 वरून 5 केले (वाचायला सोपे)
      const SECTION_GAP = 6;      // सेक्शन गॅप वाढवला
      const ITEM_GAP = 5;         // आयटम गॅप वाढवला
      
      const PRIMARY_COLOR = [37, 99, 235]; 
      const TEXT_COLOR = [51, 65, 85];     
      const GRAY_COLOR = [100, 116, 139];  

      const checkPageBreak = (spaceNeeded = 10) => {
        if (yPos + spaceNeeded > pageHeight) {
          doc.addPage();
          yPos = 15; 
        }
      };

      // ==========================================
      // 1. HEADER
      // ==========================================
      
      doc.setFillColor(...PRIMARY_COLOR);
      doc.rect(0, 0, 210, 40, "F"); // हेडरची उंची 35 वरून 40 केली
      
      // Name
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      const name = data.fullName ? data.fullName.toUpperCase() : "YOUR NAME";
      doc.text(name, 105, 18, { align: "center" });

      // Contact
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10); // फॉन्ट 9 वरून 10 केला
      
      const mobile = data.mobile || data.contactInfo?.mobile || "";
      const email = data.email || data.contactInfo?.email || "";
      const linkedin = data.linkedin || data.contactInfo?.linkedin ? "LinkedIn" : "";
      const twitter = data.twitter || data.contactInfo?.twitter ? "Twitter" : "";

      const contactLine = [email, mobile, linkedin, twitter]
        .filter(item => item && item.trim() !== "")
        .join("  •  ");

      doc.text(contactLine, 105, 28, { align: "center" });
      
      yPos = 50; // थोडी जास्त जागा सोडली

      // ==========================================
      // 2. SECTIONS
      // ==========================================

      const drawSectionTitle = (title) => {
        checkPageBreak(15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11); // टायटल फॉन्ट वाढवला
        doc.setTextColor(...PRIMARY_COLOR);
        doc.text(title.toUpperCase(), MARGIN_LEFT, yPos);
        
        doc.setDrawColor(...PRIMARY_COLOR);
        doc.setLineWidth(0.5);
        doc.line(MARGIN_LEFT, yPos + 2, 210 - MARGIN_LEFT, yPos + 2);
        
        yPos += SECTION_GAP; 
      };

      // --- SUMMARY ---
      if (data.summary) {
        drawSectionTitle("Professional Summary");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10); // बॉडी फॉन्ट 10 केला
        doc.setTextColor(...TEXT_COLOR);
        
        const splitSummary = doc.splitTextToSize(data.summary, TEXT_WIDTH);
        doc.text(splitSummary, MARGIN_LEFT, yPos);
        yPos += (splitSummary.length * LINE_HEIGHT) + ITEM_GAP;
      }

      // --- SKILLS ---
      if (data.skills) {
        drawSectionTitle("Technical Skills");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        
        const splitSkills = doc.splitTextToSize(data.skills, TEXT_WIDTH);
        doc.text(splitSkills, MARGIN_LEFT, yPos);
        yPos += (splitSkills.length * LINE_HEIGHT) + ITEM_GAP;
      }

      // --- EXPERIENCE ---
      if (data.experience?.length > 0) {
        drawSectionTitle("Work Experience");
        
        data.experience.forEach((exp) => {
          checkPageBreak(25);
          
          // Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(0, 0, 0);
          doc.text(exp.title || "Job Title", MARGIN_LEFT, yPos);

          // Date
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(...GRAY_COLOR);
          const dateStr = `${exp.startDate || ""} - ${exp.current ? "Present" : (exp.endDate || "")}`;
          doc.text(dateStr, 210 - MARGIN_LEFT, yPos, { align: "right" });
          yPos += 5;

          // Company
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(...TEXT_COLOR);
          doc.text(exp.company || exp.organization || "Company", MARGIN_LEFT, yPos);
          yPos += 5;

          // Desc
          if (exp.description) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const splitDesc = doc.splitTextToSize(exp.description, TEXT_WIDTH);
            doc.text(splitDesc, MARGIN_LEFT, yPos);
            yPos += (splitDesc.length * LINE_HEIGHT);
          }
          yPos += ITEM_GAP; 
        });
        yPos += 2;
      }

      // --- EDUCATION ---
      if (data.education?.length > 0) {
        drawSectionTitle("Education");

        data.education.forEach((edu) => {
          checkPageBreak(20);
          
          // Degree
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(0, 0, 0);
          doc.text(edu.degree || edu.title || "Degree", MARGIN_LEFT, yPos);

          // Year
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(...GRAY_COLOR);
          const yearStr = edu.year || edu.startDate || "";
          doc.text(String(yearStr), 210 - MARGIN_LEFT, yPos, { align: "right" });
          yPos += 5;

          // School
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(...TEXT_COLOR);
          doc.text(edu.school || edu.organization || "University", MARGIN_LEFT, yPos);
          
          if (edu.description) {
            yPos += 5;
            doc.setFont("helvetica", "normal");
            const splitDesc = doc.splitTextToSize(edu.description, TEXT_WIDTH);
            doc.text(splitDesc, MARGIN_LEFT, yPos);
            yPos += (splitDesc.length * LINE_HEIGHT);
          } else {
             yPos += 6;
          }
        });
        yPos += 2;
      }

      // --- PROJECTS ---
      if (data.projects?.length > 0) {
        drawSectionTitle("Key Projects");

        data.projects.forEach((proj) => {
          checkPageBreak(20);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(0, 0, 0);
          doc.text(proj.name || proj.title || "Project Name", MARGIN_LEFT, yPos);
          yPos += 5;

          if (proj.description) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(...TEXT_COLOR);
            const splitDesc = doc.splitTextToSize(proj.description, TEXT_WIDTH);
            doc.text(splitDesc, MARGIN_LEFT, yPos);
            yPos += (splitDesc.length * LINE_HEIGHT);
          }
          yPos += ITEM_GAP;
        });
      }

      doc.save("Professional-Resume-Balanced.pdf");

    } catch (err) {
      console.error("PDF Failed:", err);
      alert("Something went wrong while generating PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download One-Page PDF
    </Button>
  );
};