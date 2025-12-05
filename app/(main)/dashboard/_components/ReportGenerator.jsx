"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ReportDocument } from "./ReportDocument";

// Dynamically import PDFDownloadLink
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading PDF Tools...
      </Button>
    ),
  }
);

const REPORT_SECTIONS = [
  { id: "Market Outlook", label: "Market Outlook" },
  { id: "Industry Growth", label: "Industry Growth" },
  { id: "Demand Level", label: "Demand Level" },
  { id: "Salary Ranges by Role", label: "Salary Ranges" },
  { id: "Key Industry Trends", label: "Key Trends" },
  { id: "Recommended Skills", label: "Recommended Skills" },
];

export default function ReportGenerator({ insights }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);

  useEffect(() => {
    setSelectedSections(REPORT_SECTIONS.map((s) => s.id));
  }, []);

  const handleCheckboxChange = (id) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          <span>Export Report</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Industry Insights</DialogTitle>
          <DialogDescription>
            Customize your report by selecting the sections you wish to include.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            {REPORT_SECTIONS.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                {/* 👇 FIXED: Replaced missing Checkbox with standard input */}
                <input
                  type="checkbox"
                  id={section.id}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-black"
                  checked={selectedSections.includes(section.id)}
                  onChange={() => handleCheckboxChange(section.id)}
                />
                <Label htmlFor={section.id} className="text-sm cursor-pointer">
                  {section.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <PDFDownloadLink
            document={
              <ReportDocument 
                insights={insights} 
                selectedSections={selectedSections} 
              />
            }
            fileName={`Insights-${insights.industry || "Report"}.pdf`}
          >
            {({ loading }) => (
              <Button 
                disabled={loading || selectedSections.length === 0} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}